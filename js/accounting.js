//======================================================
// TYS POS v3
// BUSINESS ACCOUNTING MODULE
//======================================================

const ACCOUNTING_OPENING_CASH_KEY = "tys-pos-accounting-opening-cash";

function accountingDateKey(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function accountingMoney(value) {
    return typeof formatCurrency === "function"
        ? formatCurrency(Number(value || 0))
        : `KSh ${Number(value || 0).toFixed(2)}`;
}

function accountingData() {
    const state = typeof loadState === "function" ? loadState() : {};
    return {
        sales: Array.isArray(state.sales) ? state.sales : [],
        inventory: Array.isArray(state.inventory) ? state.inventory : [],
        purchases: typeof getPurchases === "function" ? getPurchases() : [],
        expenses: typeof getExpenses === "function" ? getExpenses() : []
    };
}

function accountingRange() {
    const today = accountingDateKey(new Date());
    const from = document.getElementById("accounting-from")?.value || today;
    const to = document.getElementById("accounting-to")?.value || today;
    return { from: from <= to ? from : to, to: from <= to ? to : from };
}

function inAccountingRange(value, from, to) {
    const key = accountingDateKey(value);
    return Boolean(key && key >= from && key <= to);
}

function saleCost(sale) {
    if (sale.cost !== undefined) return Number(sale.cost || 0);
    return (sale.items || []).reduce((sum, item) => {
        return sum + Number(item.cost || 0) * Number(item.quantity || 0);
    }, 0);
}

function saleRevenue(sale) {
    return Number(sale.total || 0);
}

function saleProfit(sale) {
    if (sale.profit !== undefined) return Number(sale.profit || 0);
    return saleRevenue(sale) - saleCost(sale);
}

function isCashSale(sale) {
    return String(sale.paymentMethod || sale.payment_method || "Cash").trim().toLowerCase() === "cash";
}

function accountingMetrics() {
    const { from, to } = accountingRange();
    const data = accountingData();

    const sales = data.sales.filter(s => inAccountingRange(s.date || s.saleDate || s.sale_date, from, to));
    const purchases = data.purchases.filter(p => inAccountingRange(p.date || p.createdAt || p.created_at, from, to));
    const expenses = data.expenses.filter(e => inAccountingRange(e.date || e.expense_date || e.created_at, from, to));

    const revenue = sales.reduce((sum, s) => sum + saleRevenue(s), 0);
    const cogs = sales.reduce((sum, s) => sum + saleCost(s), 0);
    const grossProfit = revenue - cogs;
    const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = grossProfit - expenseTotal;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const cashSales = sales.filter(isCashSale).reduce((sum, s) => sum + saleRevenue(s), 0);
    const purchaseTotal = purchases.reduce((sum, p) => sum + Number(p.total || (Number(p.quantity || 0) * Number(p.cost || 0))), 0);
    const cashNet = cashSales - purchaseTotal - expenseTotal;

    const openingCash = Number(localStorage.getItem(ACCOUNTING_OPENING_CASH_KEY) || 0);
    const closingCash = openingCash + cashNet;

    const inventoryValue = data.inventory.reduce((sum, product) => {
        return sum + Number(product.cost || 0) * Number(product.stock || 0);
    }, 0);

    const expenseByCategory = {};
    expenses.forEach(expense => {
        const category = expense.category || "Other";
        expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(expense.amount || 0);
    });

    return {
        from, to, sales, purchases, expenses,
        revenue, cogs, grossProfit, expenseTotal, netProfit, margin,
        cashSales, purchaseTotal, cashNet, openingCash, closingCash,
        inventoryValue, expenseByCategory
    };
}

function renderAccounting() {
    const m = accountingMetrics();

    const values = {
        "accounting-revenue": m.revenue,
        "accounting-cogs": m.cogs,
        "accounting-gross-profit": m.grossProfit,
        "accounting-expenses": m.expenseTotal,
        "accounting-net-profit": m.netProfit,
        "pnl-revenue": m.revenue,
        "pnl-cogs": m.cogs,
        "pnl-gross": m.grossProfit,
        "pnl-expenses": m.expenseTotal,
        "pnl-net": m.netProfit,
        "cash-sales": m.cashSales,
        "cash-purchases": m.purchaseTotal,
        "cash-expenses": m.expenseTotal,
        "cash-net": m.cashNet,
        "cash-closing": m.closingCash,
        "position-inventory": m.inventoryValue,
        "position-cash": m.closingCash,
        "position-assets": m.inventoryValue + m.closingCash
    };

    Object.entries(values).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = accountingMoney(value);
    });

    const margin = document.getElementById("accounting-margin");
    if (margin) margin.textContent = `${m.margin.toFixed(2)}%`;

    const breakdown = document.getElementById("accounting-expense-breakdown");
    if (breakdown) {
        const entries = Object.entries(m.expenseByCategory).sort((a, b) => b[1] - a[1]);
        breakdown.innerHTML = entries.length
            ? entries.map(([category, amount]) => `
                <div class="dashboard-row">
                    <span>${category}</span>
                    <strong>${accountingMoney(amount)}</strong>
                </div>
            `).join("")
            : `<div class="empty-state">No expenses in this period.</div>`;
    }
}

function setAccountingDates(from, to) {
    const fromInput = document.getElementById("accounting-from");
    const toInput = document.getElementById("accounting-to");
    if (fromInput) fromInput.value = from;
    if (toInput) toInput.value = to;
    renderAccounting();
}

function setTodayAccountingPeriod() {
    const today = accountingDateKey(new Date());
    setAccountingDates(today, today);
}

function setMonthAccountingPeriod() {
    const now = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const to = accountingDateKey(now);
    setAccountingDates(from, to);
}

async function refreshAccountingCloudData() {
    try {
        if (typeof loadCloudSales === "function") {
            await syncCloudSalesToPOS();
        }
        if (typeof loadCloudPurchases === "function") {
            await syncCloudPurchasesToPOS();
        }
        if (typeof loadCloudExpenses === "function") {
            await syncCloudExpensesToPOS();
        }
    } catch (error) {
        console.error("Accounting cloud refresh failed:", error);
    }
    renderAccounting();
}

function initializeAccounting() {
    const today = accountingDateKey(new Date());
    const fromInput = document.getElementById("accounting-from");
    const toInput = document.getElementById("accounting-to");
    const openingCash = document.getElementById("accounting-opening-cash");

    if (fromInput && !fromInput.value) fromInput.value = today;
    if (toInput && !toInput.value) toInput.value = today;

    if (openingCash) {
        openingCash.value = localStorage.getItem(ACCOUNTING_OPENING_CASH_KEY) || "0";
        openingCash.addEventListener("input", () => {
            localStorage.setItem(ACCOUNTING_OPENING_CASH_KEY, openingCash.value || "0");
            renderAccounting();
        });
    }

    fromInput?.addEventListener("change", renderAccounting);
    toInput?.addEventListener("change", renderAccounting);
    document.getElementById("accounting-today")?.addEventListener("click", setTodayAccountingPeriod);
    document.getElementById("accounting-month")?.addEventListener("click", setMonthAccountingPeriod);

    renderAccounting();
    refreshAccountingCloudData();
}

document.addEventListener("DOMContentLoaded", initializeAccounting, { once: true });
