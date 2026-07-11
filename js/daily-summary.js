//======================================================
// TYS POS v3
// DAILY SALES SUMMARY
//======================================================

function getDailySales() {
    const today = new Date().toDateString();

    return (loadState().sales || []).filter(sale => {
        return new Date(sale.date).toDateString() === today;
    });
}

function getDailyExpenses() {
    const today = new Date().toDateString();

    return getExpenses().filter(expense => {
        return new Date(expense.date).toDateString() === today;
    });
}

function calculateDailySummary() {
    const sales = getDailySales();
    const expenses = getDailyExpenses();

    const revenue = sales.reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);

    const grossProfit = sales.reduce((sum, sale) => {
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

    const expenseTotal = expenses.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);

    const itemsSold = sales.reduce((sum, sale) => {
        return sum + (sale.items || []).reduce((itemSum, item) => {
            return itemSum + Number(item.quantity || 0);
        }, 0);
    }, 0);

    return {
        sales,
        salesCount: sales.length,
        revenue,
        grossProfit,
        expenseTotal,
        netProfit: grossProfit - expenseTotal,
        itemsSold
    };
}

function renderDailySummary() {
    const summary = calculateDailySummary();

    document.getElementById("daily-sales-count").textContent =
        summary.salesCount;

    document.getElementById("daily-revenue").textContent =
        formatCurrency(summary.revenue);

    document.getElementById("daily-gross-profit").textContent =
        formatCurrency(summary.grossProfit);

    document.getElementById("daily-expenses").textContent =
        formatCurrency(summary.expenseTotal);

    document.getElementById("daily-net-profit").textContent =
        formatCurrency(summary.netProfit);

    document.getElementById("daily-items-sold").textContent =
        summary.itemsSold;

    renderDailySalesList(summary.sales);
}

function renderDailySalesList(sales) {
    const list = document.getElementById("daily-sales-list");

    if (!list) return;

    if (!sales.length) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No sales today.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = sales.map(sale => `
        <tr>
            <td>${new Date(sale.date).toLocaleTimeString()}</td>
            <td>${(sale.items || []).length}</td>
            <td>${formatCurrency(sale.total || 0)}</td>
            <td>${formatCurrency(sale.profit || 0)}</td>
            <td>${formatCurrency(sale.cashReceived || 0)}</td>
            <td>${formatCurrency(sale.change || 0)}</td>
        </tr>
    `).join("");
}

function printDailySummary() {
    window.print();
}

function initializeDailySummary() {
    renderDailySummary();

    const printButton = document.getElementById("print-daily-summary");

    if (printButton) {
        printButton.addEventListener("click", printDailySummary);
    }
}

document.addEventListener("DOMContentLoaded", initializeDailySummary);