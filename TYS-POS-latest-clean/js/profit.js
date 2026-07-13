//======================================================
// TYS POS v3
// PROFIT & EXPENSES MODULE
//======================================================

let expenses = getExpenses();

//------------------------------------------------------
// SAVE EXPENSE
//------------------------------------------------------

function saveExpense() {
    const name = document.getElementById("expense-name").value.trim();
    const category = document.getElementById("expense-category").value.trim();
    const amount = Number(document.getElementById("expense-amount").value);

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
        date
    });

    saveExpenses(expenses);

    renderExpenses();
    renderProfitDashboard();

    document.getElementById("expense-form").reset();
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
    renderProfitDashboard();
}

//------------------------------------------------------
// RENDER EXPENSES
//------------------------------------------------------

function renderExpenses() {
    const list = document.getElementById("expense-list");

    if (!list) return;

    expenses = getExpenses();

    if (!expenses.length) {
        list.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        No expenses recorded.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = expenses.map(expense => `
        <tr>
            <td>${formatDate(expense.date)}</td>

            <td>${expense.name}</td>

            <td>${expense.category || "-"}</td>

            <td>${formatCurrency(expense.amount)}</td>

            <td>
                <button
                    class="danger-btn"
                    onclick="deleteExpense('${expense.id}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

//------------------------------------------------------
// PROFIT DASHBOARD
//------------------------------------------------------

function renderProfitDashboard() {
    const state = loadState();
    const salesData = state.sales || [];
    const expensesData = getExpenses();

    const totalRevenue = salesData.reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);

    const totalProfit = salesData.reduce((sum, sale) => {

        if (sale.profit !== undefined) {
            return sum + Number(sale.profit || 0);
        }

        const itemsProfit = (sale.items || []).reduce((itemSum, item) => {
            const price = Number(item.price || 0);
            const cost = Number(item.cost || 0);
            const quantity = Number(item.quantity || 0);

            return itemSum + ((price - cost) * quantity);
        }, 0);

        return sum + itemsProfit;

    }, 0);

    const totalExpenses = expensesData.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);

    const netProfit = totalProfit - totalExpenses;

    document.getElementById("profit-today-revenue").textContent =
        formatCurrency(totalRevenue);

    document.getElementById("profit-today-profit").textContent =
        formatCurrency(totalProfit);

    document.getElementById("profit-total-expenses").textContent =
        formatCurrency(totalExpenses);

    document.getElementById("profit-net-profit").textContent =
        formatCurrency(netProfit);
}
//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeProfitModule() {
    renderExpenses();
    renderProfitDashboard();

    const form = document.getElementById("expense-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveExpense();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        initializeProfitModule();
    }, 200);
});