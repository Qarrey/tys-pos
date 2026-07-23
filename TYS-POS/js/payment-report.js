//======================================================
// TYS POS v3
// PAYMENT METHOD REPORT
//======================================================

function getPaymentReportSales() {
    return loadState().sales || [];
}

function calculatePaymentReport() {
    const sales = getPaymentReportSales();

    const report = {
        Cash: {
            count: 0,
            total: 0
        },
        "M-Pesa": {
            count: 0,
            total: 0
        },
        Card: {
            count: 0,
            total: 0
        },
        "Bank Transfer": {
            count: 0,
            total: 0
        }
    };

    sales.forEach(sale => {
        const method = sale.paymentMethod || "Cash";

        if (!report[method]) {
            report[method] = {
                count: 0,
                total: 0
            };
        }

        report[method].count += 1;
        report[method].total += Number(sale.total || 0);
    });

    return report;
}

function renderPaymentReport() {
    const report = calculatePaymentReport();

    const cash = document.getElementById("payment-cash");
    const mpesa = document.getElementById("payment-mpesa");
    const card = document.getElementById("payment-card");
    const bank = document.getElementById("payment-bank");
    const list = document.getElementById("payment-report-list");

    if (cash) cash.textContent = formatCurrency(report.Cash.total);
    if (mpesa) mpesa.textContent = formatCurrency(report["M-Pesa"].total);
    if (card) card.textContent = formatCurrency(report.Card.total);
    if (bank) bank.textContent = formatCurrency(report["Bank Transfer"].total);

    if (!list) return;

    const rows = Object.entries(report);

    const hasSales = rows.some(([_, data]) => data.count > 0);

    if (!hasSales) {
        list.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="empty-state">
                        No payment records.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = rows.map(([method, data]) => `
        <tr>
            <td><strong>${method}</strong></td>
            <td>${data.count}</td>
            <td>${formatCurrency(data.total)}</td>
        </tr>
    `).join("");
}

document.addEventListener("DOMContentLoaded", renderPaymentReport);