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

function getTodaySales() {
    const today = new Date().toDateString();

    return getReportSales().filter(sale => {
        return new Date(sale.date).toDateString() === today;
    });
}

function getTodayExpenses() {
    const today = new Date().toDateString();

    return getReportExpenses().filter(expense => {
        return new Date(expense.date).toDateString() === today;
    });
}

function getTodayRevenue() {
    return getTodaySales().reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);
}

function getTodayProfit() {
    return getTodaySales().reduce((sum, sale) => {
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

function getTodayExpenseTotal() {
    return getTodayExpenses().reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);
}

function getTodayNetProfit() {
    return getTodayProfit() - getTodayExpenseTotal();
}

function getMonthlyRevenue() {
    const now = new Date();

    return getReportSales()
        .filter(sale => {
            const date = new Date(sale.date);
            return date.getMonth() === now.getMonth() &&
                   date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, sale) => {
            return sum + Number(sale.total || 0);
        }, 0);
}

function getInventoryValue() {
    return getReportInventory().reduce((sum, product) => {
        return sum + (
            Number(product.cost || 0) *
            Number(product.stock || 0)
        );
    }, 0);
}

function renderReportsPage() {
    const todayRevenue = document.getElementById("report-today-revenue");
    const todayProfit = document.getElementById("report-today-profit");
    const monthlyRevenue = document.getElementById("report-monthly-revenue");
    const inventoryValue = document.getElementById("report-inventory-value");
    const netProfit = document.getElementById("report-net-profit");

    if (todayRevenue) {
        todayRevenue.textContent = formatCurrency(getTodayRevenue());
    }

    if (todayProfit) {
        todayProfit.textContent = formatCurrency(getTodayProfit());
    }

    if (monthlyRevenue) {
        monthlyRevenue.textContent = formatCurrency(getMonthlyRevenue());
    }

    if (inventoryValue) {
        inventoryValue.textContent = formatCurrency(getInventoryValue());
    }

    if (netProfit) {
        netProfit.textContent = formatCurrency(getTodayNetProfit());
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderReportsPage();
});