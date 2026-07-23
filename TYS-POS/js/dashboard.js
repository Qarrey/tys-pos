//======================================================
// TYS POS v3
// DASHBOARD MODULE
// PART 1
//======================================================

//------------------------------------------------------
// TODAY'S SALES
//------------------------------------------------------

function getTodaySales() {

    const today = new Date().toDateString();

    return sales.filter(sale => {

        return new Date(sale.date).toDateString() === today;

    });

}

//------------------------------------------------------
// TODAY'S REVENUE
//------------------------------------------------------

function getTodayRevenue() {

    return getTodaySales().reduce((sum, sale) => {

        return sum + sale.total;

    }, 0);

}

//------------------------------------------------------
// TODAY'S PROFIT
//------------------------------------------------------

function getTodayProfit() {

    return getTodaySales().reduce((sum, sale) => {

        return sum + (sale.profit || 0);

    }, 0);

}

//------------------------------------------------------
// INVENTORY VALUE
//------------------------------------------------------

function getInventoryValue() {

    return inventory.reduce((sum, product) => {

        return sum + (product.cost * product.stock);

    }, 0);

}

//------------------------------------------------------
// LOW STOCK COUNT
//------------------------------------------------------

function getLowStockCount() {

    return inventory.filter(product => {

        return product.stock <= 5;

    }).length;

}

//------------------------------------------------------
// OUT OF STOCK COUNT
//------------------------------------------------------

function getOutOfStockCount() {

    return inventory.filter(product => {

        return product.stock <= 0;

    }).length;

}
//======================================================
// TYS POS v3
// DASHBOARD MODULE
// PART 2
//======================================================

//------------------------------------------------------
// UPDATE DASHBOARD
//------------------------------------------------------

function updateDashboardMetrics() {

    //--------------------------------------------------
    // Today's Sales
    //--------------------------------------------------

    const salesMetric = document.getElementById("metric-sales");

    if (salesMetric) {

        salesMetric.textContent = getTodaySales().length;

    }

    //--------------------------------------------------
    // Today's Revenue
    //--------------------------------------------------

    const revenueMetric = document.getElementById("metric-today-sales");

    if (revenueMetric) {

        revenueMetric.textContent = formatCurrency(

            getTodayRevenue()

        );

    }

    //--------------------------------------------------
    // Today's Profit
    //--------------------------------------------------

    const profitMetric = document.getElementById("metric-profit");

    if (profitMetric) {

        profitMetric.textContent = formatCurrency(

            getTodayProfit()

        );

    }

    //--------------------------------------------------
    // Products
    //--------------------------------------------------

    const productsMetric = document.getElementById("metric-products");

    if (productsMetric) {

        productsMetric.textContent = inventory.length;

    }

    //--------------------------------------------------
    // Purchases
    //--------------------------------------------------

    const purchasesMetric = document.getElementById("metric-purchases");

    if (purchasesMetric) {

        purchasesMetric.textContent = purchases.length;

    }

    //--------------------------------------------------
    // Low Stock
    //--------------------------------------------------

    const lowStockMetric = document.getElementById("metric-low-stock");

    if (lowStockMetric) {

        lowStockMetric.textContent = getLowStockCount();

    }

    //--------------------------------------------------
    // Out of Stock
    //--------------------------------------------------

    const outMetric = document.getElementById("metric-out-stock");

    if (outMetric) {

        outMetric.textContent = getOutOfStockCount();

    }

    //--------------------------------------------------
    // Inventory Value
    //--------------------------------------------------

    const inventoryMetric = document.getElementById("metric-inventory-value");

    if (inventoryMetric) {

        inventoryMetric.textContent = formatCurrency(

            getInventoryValue()

        );

    }

}
//======================================================
// TYS POS v3
// DASHBOARD MODULE
// PART 3
//======================================================

//------------------------------------------------------
// BEST SELLERS
//------------------------------------------------------

function renderDashboardBestSellers() {

    const container = document.getElementById("best-sellers");

    if (!container) return;

    if (!sales.length) {

        container.innerHTML = `

            <div class="empty-state">

                No sales recorded yet.

            </div>

        `;

        return;

    }

    const totals = {};

    sales.forEach(sale => {

        sale.items.forEach(item => {

            if (!totals[item.name]) {

                totals[item.name] = 0;

            }

            totals[item.name] += item.quantity;

        });

    });

    const ranked = Object.entries(totals)

        .sort((a, b) => b[1] - a[1])

        .slice(0, 5);

    container.innerHTML = ranked.map(([name, qty], index) => `

        <div class="sales-row">

            <div>

                <strong>

                    #${index + 1} ${name}

                </strong>

                <div class="small">

                    Best Selling Product

                </div>

            </div>

            <strong>

                ${qty} sold

            </strong>

        </div>

    `).join("");

}

//------------------------------------------------------
// RECENT SALES
//------------------------------------------------------

function renderDashboardSales() {

    const container = document.getElementById("sales-history");

    if (!container) return;

    if (!sales.length) {

        container.innerHTML = `

            <div class="empty-state">

                No sales recorded yet.

            </div>

        `;

        return;

    }

    container.innerHTML = sales

        .slice(0, 10)

        .map(sale => `

            <div class="sales-row">

                <div>

                    <strong>

                        ${new Date(sale.date).toLocaleString()}

                    </strong>

                    <div class="small">

                        ${sale.items.length} item(s)

                    </div>

                </div>

                <div>

                    <strong>

                        ${formatCurrency(sale.total)}

                    </strong>

                </div>

            </div>

        `)

        .join("");

}
//======================================================
// TYS POS v3
// DASHBOARD MODULE
// PART 4
//======================================================

//------------------------------------------------------
// REFRESH DASHBOARD
//------------------------------------------------------

function refreshDashboard() {

    updateDashboardMetrics();

    renderDashboardSales();

    renderDashboardBestSellers();

}

//------------------------------------------------------
// INITIALIZE DASHBOARD
//------------------------------------------------------

function initializeDashboard() {

    refreshDashboard();

}

//------------------------------------------------------
// AUTO START
//------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    initializeDashboard();

});

//------------------------------------------------------
// PUBLIC REFRESH
//------------------------------------------------------

window.refreshDashboard = refreshDashboard;