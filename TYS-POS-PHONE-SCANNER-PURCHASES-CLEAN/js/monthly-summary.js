//======================================================
// TYS POS v3
// MONTHLY BUSINESS SUMMARY
//======================================================

function getMonthlySummarySales() {
    const now = new Date();

    return (loadState().sales || []).filter(sale => {
        const date = new Date(sale.date);

        return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    });
}

function getMonthlySummaryExpenses() {
    const now = new Date();

    return getExpenses().filter(expense => {
        const date = new Date(expense.date);

        return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    });
}

function calculateMonthlySummary() {
    const sales = getMonthlySummarySales();
    const expenses = getMonthlySummaryExpenses();

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
        expenses: expenseTotal,
        netProfit: grossProfit - expenseTotal,
        itemsSold
    };
}

function renderMonthlySummary() {
    const summary = calculateMonthlySummary();

    document.getElementById("monthly-revenue").textContent =
        formatCurrency(summary.revenue);

    document.getElementById("monthly-gross-profit").textContent =
        formatCurrency(summary.grossProfit);

    document.getElementById("monthly-expenses").textContent =
        formatCurrency(summary.expenses);

    document.getElementById("monthly-net-profit").textContent =
        formatCurrency(summary.netProfit);

    document.getElementById("monthly-sales-count").textContent =
        summary.salesCount;

    document.getElementById("monthly-items-sold").textContent =
        summary.itemsSold;

    renderMonthlySalesList(summary.sales);
}

function renderMonthlySalesList(sales) {
    const list = document.getElementById("monthly-sales-list");

    if (!list) return;

    if (!sales.length) {
        list.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        No sales this month.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = sales.map(sale => `
        <tr>
            <td>${formatDate(sale.date)}</td>
            <td>${(sale.items || []).length}</td>
            <td>${formatCurrency(sale.total || 0)}</td>
            <td>${formatCurrency(sale.profit || 0)}</td>
            <td>${sale.paymentMethod || "Cash"}</td>
        </tr>
    `).join("");
}

function initializeMonthlySummary() {
    renderMonthlySummary();

    const printButton = document.getElementById("print-monthly-summary");

    if (printButton) {
        printButton.addEventListener("click", () => {
            window.print();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeMonthlySummary);