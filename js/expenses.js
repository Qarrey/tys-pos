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

    expenses.unshift({
        id: generateId("EXP-"),
        name,
        category,
        amount,
        notes,
        date
    });

    saveExpenses(expenses);

    renderExpenses();
    updateExpenseSummary();

    document.getElementById("expense-form").reset();
}

//------------------------------------------------------
// RENDER EXPENSES
//------------------------------------------------------

function renderExpenses(search = "") {
    const list = document.getElementById("expense-list");

    if (!list) return;

    expenses = getExpenses();

    const keyword = search.trim().toLowerCase();

    const filtered = expenses.filter(expense => {
        return (
            expense.name.toLowerCase().includes(keyword) ||
            (expense.category || "").toLowerCase().includes(keyword) ||
            (expense.notes || "").toLowerCase().includes(keyword)
        );
    });

    if (!filtered.length) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No expenses recorded.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = filtered.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.name}</td>
            <td>${expense.category || "-"}</td>
            <td>${formatCurrency(expense.amount)}</td>
            <td>${expense.notes || "-"}</td>
            <td>
                <button
                    class="danger-btn delete-expense"
                    data-id="${expense.id}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".delete-expense").forEach(button => {
        button.addEventListener("click", () => {
            deleteExpense(button.dataset.id);
        });
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

function initializeExpenseSearch() {
    const search = document.getElementById("expense-search");

    if (!search) return;

    search.addEventListener("input", () => {
        renderExpenses(search.value);
    });

    const clear = document.getElementById("clear-expense-search");

    if (clear) {
        clear.addEventListener("click", () => {
            search.value = "";
            renderExpenses();
        });
    }
}

//------------------------------------------------------
// EXPORT
//------------------------------------------------------

function exportExpensesCSV() {
    expenses = getExpenses();

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