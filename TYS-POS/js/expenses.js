//======================================================
// TYS POS v3
// EXPENSES MODULE
//======================================================

let expenses = getExpenses();

//------------------------------------------------------
// SAVE EXPENSE
//------------------------------------------------------

function saveExpense() {
    const name = document.getElementById("expense-name").value.trim();
    const category = document.getElementById("expense-category").value;
    const amount = Number(document.getElementById("expense-amount").value);
    const notes = document.getElementById("expense-notes").value.trim();

    const dateInput = document.getElementById("expense-date");

    const date = dateInput && dateInput.value
        ? new Date(dateInput.value).toISOString()
        : new Date().toISOString();

    if (!name || amount <= 0) {
        alert("Please enter expense name and amount.");
        return;
    }

    expenses = getExpenses();
const expense = {
    id: generateId("EXP-"),
    name,
    category,
    amount,
    notes,
    date
};

expenses.unshift(expense);

saveExpenses(expenses);


// SAVE TO SUPABASE

if (
    typeof saveExpenseToSupabase === "function"
) {
    saveExpenseToSupabase(expense)
        .then(result => {
            if (result) {
                console.log(
                    "Expense saved locally and online."
                );
            }
        })
        .catch(error => {
            console.error(
                "Cloud expense save failed:",
                error
            );
        });
}

    renderExpenses();
    updateExpenseSummary();

    document.getElementById("expense-form").reset();
}

//------------------------------------------------------
// RENDER EXPENSES
//------------------------------------------------------

function localExpenseDateKey(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function renderExpenses() {
    const list = document.getElementById("expense-list");
    if (!list) return;

    expenses = getExpenses();
    const keyword = String(document.getElementById("expense-search")?.value || "").trim().toLowerCase();
    const category = document.getElementById("expense-filter-category")?.value || "";
    const from = document.getElementById("expense-filter-from")?.value || "";
    const to = document.getElementById("expense-filter-to")?.value || "";

    const filtered = expenses.filter(expense => {
        const dateKey = localExpenseDateKey(expense.date);
        return String(expense.name || "").toLowerCase().includes(keyword)
            && (!category || expense.category === category)
            && (!from || dateKey >= from)
            && (!to || dateKey <= to);
    });
    window.filteredExpenses = filtered;

    if (!filtered.length) {
        list.innerHTML = '<tr><td colspan="6"><div class="empty-state">No expenses match the selected filters.</div></td></tr>';
        return;
    }

    list.innerHTML = filtered.map(expense => `
        <tr><td>${formatDate(expense.date)}</td><td>${expense.name}</td><td>${expense.category || "-"}</td>
        <td>${formatCurrency(expense.amount)}</td><td>${expense.notes || "-"}</td>
        <td><button class="danger-btn delete-expense" data-id="${expense.id}">Delete</button></td></tr>`).join("");

    document.querySelectorAll(".delete-expense").forEach(button => {
        button.addEventListener("click", () => deleteExpense(button.dataset.id));
    });
}

//------------------------------------------------------
// DELETE EXPENSE
//------------------------------------------------------

function deleteExpense(id) {
    expenses = getExpenses();

    const expense = expenses.find(item => item.id === id);

    if (!expense) return;

    if (!confirm(`Delete "${expense.name}"?`)) return;

    expenses = expenses.filter(item => item.id !== id);

    saveExpenses(expenses);


// DELETE FROM SUPABASE

if (
    typeof deleteExpenseFromSupabase === "function"
) {
    deleteExpenseFromSupabase(id)
        .catch(error => {
            console.error(
                "Cloud expense deletion failed:",
                error
            );
        });
}


renderExpenses();

updateExpenseSummary();
}

//------------------------------------------------------
// SUMMARY
//------------------------------------------------------

function updateExpenseSummary() {
    expenses = getExpenses();

    const today = new Date().toDateString();
    const now = new Date();

    const total = expenses.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);

    const todayTotal = expenses
        .filter(expense => new Date(expense.date).toDateString() === today)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const monthTotal = expenses
        .filter(expense => {
            const date = new Date(expense.date);

            return (
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
            );
        })
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const totalEl = document.getElementById("expense-total");
    const todayEl = document.getElementById("expense-today");
    const monthEl = document.getElementById("expense-month");
    const countEl = document.getElementById("expense-count");

    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (todayEl) todayEl.textContent = formatCurrency(todayTotal);
    if (monthEl) monthEl.textContent = formatCurrency(monthTotal);
    if (countEl) countEl.textContent = expenses.length;
}

//------------------------------------------------------
// SEARCH
//------------------------------------------------------

function localExpenseDateKey(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function populateExpenseCategoryFilter() {
    const select=document.getElementById("expense-filter-category");
    if (!select) return;
    const categories=[...new Set(getExpenses().map(e=>e.category).filter(Boolean))].sort();
    select.innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function initializeExpenseSearch() {
    const search=document.getElementById("expense-search");
    search?.addEventListener("input", renderExpenses);
    document.getElementById("apply-expense-filters")?.addEventListener("click", renderExpenses);
    document.getElementById("expense-filter-category")?.addEventListener("change", renderExpenses);
    const clear=document.getElementById("clear-expense-search");
    clear?.addEventListener("click",()=>{
        ["expense-search","expense-filter-from","expense-filter-to"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
        const cat=document.getElementById("expense-filter-category"); if(cat)cat.value=""; renderExpenses();
    });
}

//------------------------------------------------------
// EXPORT
//------------------------------------------------------

function exportExpensesCSV() {
    expenses = Array.isArray(window.filteredExpenses) ? window.filteredExpenses : getExpenses();

    const rows = [
        ["Date", "Expense", "Category", "Amount", "Notes"]
    ];

    expenses.forEach(expense => {
        rows.push([
            formatDate(expense.date),
            expense.name,
            expense.category || "",
            expense.amount,
            expense.notes || ""
        ]);
    });

    downloadCSV("expenses.csv", rows);
}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeExpensesModule() {
    populateExpenseCategoryFilter();
    renderExpenses();
    updateExpenseSummary();
    initializeExpenseSearch();

    const form = document.getElementById("expense-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveExpense();
        });
    }

    const exportButton = document.getElementById("export-expenses-btn");

    if (exportButton) {
        exportButton.addEventListener("click", exportExpensesCSV);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeExpensesModule();
});