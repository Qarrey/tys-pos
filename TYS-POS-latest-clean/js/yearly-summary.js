//======================================================
// TYS POS v3
// YEARLY BUSINESS SUMMARY
//======================================================

function getYearlySales() {
    const year = new Date().getFullYear();

    return (loadState().sales || []).filter(sale => {
        return new Date(sale.date).getFullYear() === year;
    });
}

function getYearlyExpenses() {
    const year = new Date().getFullYear();

    return getExpenses().filter(expense => {
        return new Date(expense.date).getFullYear() === year;
    });
}

function getSaleProfit(sale) {
    if (sale.profit !== undefined) {
        return Number(sale.profit || 0);
    }

    return (sale.items || []).reduce((sum, item) => {
        return sum + (
            (Number(item.price || 0) - Number(item.cost || 0)) *
            Number(item.quantity || 0)
        );
    }, 0);
}

function calculateYearlySummary() {
    const sales = getYearlySales();
    const expenses = getYearlyExpenses();

    const revenue = sales.reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);

    const grossProfit = sales.reduce((sum, sale) => {
        return sum + getSaleProfit(sale);
    }, 0);

    const expenseTotal = expenses.reduce((sum, expense) => {
        return sum + Number(expense.amount || 0);
    }, 0);

    return {
        sales,
        expenses,
        revenue,
        grossProfit,
        expenseTotal,
        netProfit: grossProfit - expenseTotal
    };
}

function calculateMonthlyBreakdown() {
    const sales = getYearlySales();
    const expenses = getYearlyExpenses();

    const months = Array.from({ length: 12 }, (_, index) => ({
        monthIndex: index,
        monthName: new Date(new Date().getFullYear(), index, 1)
            .toLocaleString("default", { month: "long" }),
        salesCount: 0,
        revenue: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0
    }));

    sales.forEach(sale => {
        const month = new Date(sale.date).getMonth();

        months[month].salesCount += 1;
        months[month].revenue += Number(sale.total || 0);
        months[month].grossProfit += getSaleProfit(sale);
    });

    expenses.forEach(expense => {
        const month = new Date(expense.date).getMonth();

        months[month].expenses += Number(expense.amount || 0);
    });

    months.forEach(month => {
        month.netProfit = month.grossProfit - month.expenses;
    });

    return months;
}

function renderYearlySummary() {
    const summary = calculateYearlySummary();

    document.getElementById("yearly-revenue").textContent =
        formatCurrency(summary.revenue);

    document.getElementById("yearly-gross-profit").textContent =
        formatCurrency(summary.grossProfit);

    document.getElementById("yearly-expenses").textContent =
        formatCurrency(summary.expenseTotal);

    document.getElementById("yearly-net-profit").textContent =
        formatCurrency(summary.netProfit);

    renderYearlyBreakdown();
}

function renderYearlyBreakdown() {
    const list = document.getElementById("yearly-breakdown-list");

    if (!list) return;

    const months = calculateMonthlyBreakdown();

    const hasData = months.some(month => {
        return (
            month.salesCount > 0 ||
            month.revenue > 0 ||
            month.expenses > 0
        );
    });

    if (!hasData) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No yearly data found.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = months.map(month => `
        <tr>
            <td>${month.monthName}</td>
            <td>${month.salesCount}</td>
            <td>${formatCurrency(month.revenue)}</td>
            <td>${formatCurrency(month.grossProfit)}</td>
            <td>${formatCurrency(month.expenses)}</td>
            <td>${formatCurrency(month.netProfit)}</td>
        </tr>
    `).join("");
}

function initializeYearlySummary() {
    renderYearlySummary();

    const printButton = document.getElementById("print-yearly-summary");

    if (printButton) {
        printButton.addEventListener("click", () => {
            window.print();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeYearlySummary);