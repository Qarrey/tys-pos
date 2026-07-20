//======================================================
// TYS POS v3
// REPORTS MODULE — CUSTOM DATE FILTERS
//======================================================

let reportDateFrom = "";
let reportDateTo = "";

function getReportSales() {
    const state = typeof loadState === "function" ? loadState() : {};
    return Array.isArray(state.sales) ? state.sales : [];
}

function getReportInventory() {
    const state = typeof loadState === "function" ? loadState() : {};
    return Array.isArray(state.inventory) ? state.inventory : [];
}

function getReportExpenses() {
    if (typeof getExpenses === "function") {
        const expenses = getExpenses();
        return Array.isArray(expenses) ? expenses : [];
    }

    try {
        return JSON.parse(localStorage.getItem("tys-pos-expenses")) || [];
    } catch {
        return [];
    }
}

function getSaleDate(sale) {
    return new Date(
        sale?.date ||
        sale?.sale_date ||
        sale?.sold_at ||
        sale?.created_at ||
        0
    );
}

function getExpenseDate(expense) {
    return new Date(expense?.date || expense?.created_at || 0);
}

function startOfSelectedDay(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function endOfSelectedDay(value) {
    if (!value) return null;
    const date = new Date(`${value}T23:59:59.999`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInReportRange(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return false;
    }

    const from = startOfSelectedDay(reportDateFrom);
    const to = endOfSelectedDay(reportDateTo);

    if (from && date < from) return false;
    if (to && date > to) return false;

    return true;
}

function getFilteredReportSales() {
    return getReportSales().filter(sale => isDateInReportRange(getSaleDate(sale)));
}

function getFilteredReportExpenses() {
    return getReportExpenses().filter(expense => isDateInReportRange(getExpenseDate(expense)));
}

function calculateSalesRevenue(sales) {
    return sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
}

function calculateSalesProfit(sales) {
    return sales.reduce((sum, sale) => {
        if (sale.profit !== undefined && sale.profit !== null) {
            return sum + Number(sale.profit || 0);
        }

        const itemProfit = (sale.items || []).reduce((itemSum, item) => {
            return itemSum + (
                (Number(item.price || 0) - Number(item.cost || 0)) *
                Number(item.quantity || 0)
            );
        }, 0);

        return sum + itemProfit;
    }, 0);
}

function calculateExpenseTotal(expenses) {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function getInventoryValue() {
    return getReportInventory().reduce((sum, product) => {
        return sum + Number(product.cost || 0) * Number(product.stock || 0);
    }, 0);
}

function formatReportItems(sale) {
    const items = Array.isArray(sale.items) ? sale.items : [];

    if (!items.length) {
        return '<span class="small">No item details</span>';
    }

    return items.map(item => {
        const name = String(item.name || item.product_name || "Unknown Product");
        const quantity = Number(item.quantity || 0);
        return `<div class="small"><strong>${name}</strong> × ${quantity}</div>`;
    }).join("");
}

function getReportRangeLabel() {
    if (!reportDateFrom && !reportDateTo) return "All recorded dates";
    if (reportDateFrom && reportDateTo) return `${reportDateFrom} to ${reportDateTo}`;
    if (reportDateFrom) return `From ${reportDateFrom}`;
    return `Up to ${reportDateTo}`;
}

function renderReportSalesTable(sales) {
    const list = document.getElementById("report-sales-list");
    if (!list) return;

    if (!sales.length) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">No sales found for the selected dates.</div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = sales.map(sale => `
        <tr>
            <td>${getSaleDate(sale).toLocaleString()}</td>
            <td>${formatReportItems(sale)}</td>
            <td>${sale.cashierName || sale.cashier_name || "Admin"}</td>
            <td>${sale.paymentMethod || sale.payment_method || "Cash"}</td>
            <td>${formatCurrency(Number(sale.total || 0))}</td>
            <td>${formatCurrency(Number(sale.profit || 0))}</td>
        </tr>
    `).join("");
}

function renderReportsPage() {
    const sales = getFilteredReportSales();
    const expenses = getFilteredReportExpenses();

    const revenue = calculateSalesRevenue(sales);
    const grossProfit = calculateSalesProfit(sales);
    const expenseTotal = calculateExpenseTotal(expenses);
    const netProfit = grossProfit - expenseTotal;

    const values = {
        "report-range-label": getReportRangeLabel(),
        "report-sales-count": String(sales.length),
        "report-range-revenue": formatCurrency(revenue),
        "report-range-profit": formatCurrency(grossProfit),
        "report-range-expenses": formatCurrency(expenseTotal),
        "report-net-profit": formatCurrency(netProfit),
        "report-inventory-value": formatCurrency(getInventoryValue())
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    renderReportSalesTable(sales);
}

function applyReportDateFilter() {
    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");

    const from = fromInput?.value || "";
    const to = toInput?.value || "";

    if (from && to && new Date(from) > new Date(to)) {
        alert("The From date cannot be later than the To date.");
        return;
    }

    reportDateFrom = from;
    reportDateTo = to;
    renderReportsPage();
}

function clearReportDateFilter() {
    reportDateFrom = "";
    reportDateTo = "";

    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");

    if (fromInput) fromInput.value = "";
    if (toInput) toInput.value = "";

    renderReportsPage();
}

function setReportQuickRange(range) {
    const now = new Date();
    let from = new Date(now);
    let to = new Date(now);

    if (range === "today") {
        // Keep today.
    } else if (range === "week") {
        const day = now.getDay();
        const difference = day === 0 ? 6 : day - 1;
        from.setDate(now.getDate() - difference);
    } else if (range === "month") {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const formatInputDate = date => {
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    const fromInput = document.getElementById("report-date-from");
    const toInput = document.getElementById("report-date-to");

    if (fromInput) fromInput.value = formatInputDate(from);
    if (toInput) toInput.value = formatInputDate(to);

    applyReportDateFilter();
}

function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(filename, rows) {
    const content = rows.map(row => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function exportSalesReport() {
    const sales = getFilteredReportSales();
    const rows = [["Date", "Items", "Cashier", "Payment", "Subtotal", "Discount", "Total", "Profit"]];

    sales.forEach(sale => {
        const items = (sale.items || []).map(item => `${item.name || "Unknown Product"} x${Number(item.quantity || 0)}`).join("; ");
        rows.push([
            getSaleDate(sale).toLocaleString(),
            items,
            sale.cashierName || "Admin",
            sale.paymentMethod || "Cash",
            Number(sale.subtotal || sale.total || 0),
            Number(sale.discount || 0),
            Number(sale.total || 0),
            Number(sale.profit || 0)
        ]);
    });

    downloadCSV(`sales-report-${reportDateFrom || "all"}-to-${reportDateTo || "all"}.csv`, rows);
}

function exportInventoryReport() {
    const rows = [["Product", "SKU", "Category", "Cost", "Selling Price", "Stock", "Inventory Value"]];

    getReportInventory().forEach(product => {
        rows.push([
            product.name || "",
            product.sku || "",
            product.category || "",
            Number(product.cost || 0),
            Number(product.sellingPrice ?? product.selling_price ?? 0),
            Number(product.stock || 0),
            Number(product.cost || 0) * Number(product.stock || 0)
        ]);
    });

    downloadCSV("inventory-report.csv", rows);
}

function initializeReportsModule() {
    document.getElementById("apply-report-filter")?.addEventListener("click", applyReportDateFilter);
    document.getElementById("clear-report-filter")?.addEventListener("click", clearReportDateFilter);
    document.getElementById("report-today-btn")?.addEventListener("click", () => setReportQuickRange("today"));
    document.getElementById("report-week-btn")?.addEventListener("click", () => setReportQuickRange("week"));
    document.getElementById("report-month-btn")?.addEventListener("click", () => setReportQuickRange("month"));
    document.getElementById("export-sales-report-btn")?.addEventListener("click", exportSalesReport);
    document.getElementById("export-inventory-report-btn")?.addEventListener("click", exportInventoryReport);

    renderReportsPage();
}

document.addEventListener("DOMContentLoaded", initializeReportsModule);
