//======================================================
// TYS POS v3
// REPORTS MODULE
//======================================================

function getReportSales() {
    return loadState().sales || [];
}

function getReportInventory() {
    return loadState().inventory || [];
}

function getReportExpenses() {
    return getExpenses();
}

function reportDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getReportDateRange() {
    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");

    const today = reportDateKey(new Date());

    return {
        from: fromInput?.value || today,
        to: toInput?.value || today
    };
}

function isDateInReportRange(value, from, to) {
    const key = reportDateKey(value);
    return !!key && key >= from && key <= to;
}

function getFilteredReportSales() {
    const { from, to } = getReportDateRange();
    return getReportSales().filter(sale =>
        isDateInReportRange(sale.date, from, to)
    );
}

function getFilteredReportExpenses() {
    const { from, to } = getReportDateRange();
    return getReportExpenses().filter(expense =>
        isDateInReportRange(expense.date, from, to)
    );
}

function getFilteredRevenue() {
    return getFilteredReportSales().reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);
}

function getFilteredProfit() {
    return getFilteredReportSales().reduce((sum, sale) => {
        if (sale.profit !== undefined) {
            return sum + Number(sale.profit || 0);
        }

        return sum + (sale.items || []).reduce((itemSum, item) => {
            return itemSum + (
                (Number(item.price || 0) - Number(item.cost || 0)) *
                Number(item.quantity || 0)
            );
        }, 0);
    }, 0);
}

function getFilteredExpenseTotal() {
    return getFilteredReportExpenses().reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);
}

function getFilteredNetProfit() {
    return getFilteredProfit() - getFilteredExpenseTotal();
}

function getTodaySales() {
    const today = reportDateKey(new Date());
    return getReportSales().filter(sale => reportDateKey(sale.date) === today);
}

function getTodayExpenses() {
    const today = reportDateKey(new Date());
    return getReportExpenses().filter(expense => reportDateKey(expense.date) === today);
}

function getTodayRevenue() {
    return getTodaySales().reduce((sum, sale) => sum + Number(sale.total || 0), 0);
}

function getTodayProfit() {
    return getTodaySales().reduce((sum, sale) => {
        if (sale.profit !== undefined) return sum + Number(sale.profit || 0);
        return sum + (sale.items || []).reduce((itemSum, item) => {
            return itemSum + ((Number(item.price || 0) - Number(item.cost || 0)) * Number(item.quantity || 0));
        }, 0);
    }, 0);
}

function getTodayExpenseTotal() {
    return getTodayExpenses().reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function getTodayNetProfit() {
    return getTodayProfit() - getTodayExpenseTotal();
}

function getMonthlyRevenue() {
    const now = new Date();
    return getReportSales().filter(sale => {
        const date = new Date(sale.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, sale) => sum + Number(sale.total || 0), 0);
}

function getInventoryValue() {
    return getReportInventory().reduce((sum, product) => {
        return sum + (Number(product.cost || 0) * Number(product.stock || 0));
    }, 0);
}

function setDefaultReportDates() {
    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");
    const today = reportDateKey(new Date());

    if (fromInput && !fromInput.value) fromInput.value = today;
    if (toInput && !toInput.value) toInput.value = today;
}

function renderReportsPage() {
    setDefaultReportDates();

    const todayRevenue = document.getElementById("report-today-revenue");
    const todayProfit = document.getElementById("report-today-profit");
    const monthlyRevenue = document.getElementById("report-monthly-revenue");
    const inventoryValue = document.getElementById("report-inventory-value");
    const netProfit = document.getElementById("report-net-profit");
    const filteredRevenue = document.getElementById("report-filtered-revenue");
    const filteredProfit = document.getElementById("report-filtered-profit");
    const filteredExpenses = document.getElementById("report-filtered-expenses");
    const filteredNetProfit = document.getElementById("report-filtered-net-profit");
    const filteredTransactions = document.getElementById("report-filtered-transactions");

    if (todayRevenue) todayRevenue.textContent = formatCurrency(getTodayRevenue());
    if (todayProfit) todayProfit.textContent = formatCurrency(getTodayProfit());
    if (monthlyRevenue) monthlyRevenue.textContent = formatCurrency(getMonthlyRevenue());
    if (inventoryValue) inventoryValue.textContent = formatCurrency(getInventoryValue());
    if (netProfit) netProfit.textContent = formatCurrency(getTodayNetProfit());

    const sales = getFilteredReportSales();
    if (filteredRevenue) filteredRevenue.textContent = formatCurrency(getFilteredRevenue());
    if (filteredProfit) filteredProfit.textContent = formatCurrency(getFilteredProfit());
    if (filteredExpenses) filteredExpenses.textContent = formatCurrency(getFilteredExpenseTotal());
    if (filteredNetProfit) filteredNetProfit.textContent = formatCurrency(getFilteredNetProfit());
    if (filteredTransactions) filteredTransactions.textContent = sales.length;
}

function clearReportDateFilter() {
    const today = reportDateKey(new Date());
    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");

    if (fromInput) fromInput.value = today;
    if (toInput) toInput.value = today;

    renderReportsPage();
}

document.addEventListener("DOMContentLoaded", () => {
    setDefaultReportDates();

    document.getElementById("report-date-from")?.addEventListener("change", renderReportsPage);
    document.getElementById("report-date-to")?.addEventListener("change", renderReportsPage);
    document.getElementById("report-date-clear")?.addEventListener("click", clearReportDateFilter);

    renderReportsPage();
});
