//======================================================
// TYS POS v3
// SAFE APP BOOTSTRAP
//======================================================

/*
 * Keep one shared set of global arrays for older modules that use
 * variables such as `inventory` and newer modules that use
 * `window.inventory`.
 */
var inventory = Array.isArray(window.inventory) ? window.inventory : [];
var sales = Array.isArray(window.sales) ? window.sales : [];
var suppliers = Array.isArray(window.suppliers) ? window.suppliers : [];
var purchases = Array.isArray(window.purchases) ? window.purchases : [];
var stockMovements = Array.isArray(window.stockMovements) ? window.stockMovements : [];
var expenses = Array.isArray(window.expenses) ? window.expenses : [];

window.inventory = inventory;
window.sales = sales;
window.suppliers = suppliers;
window.purchases = purchases;
window.stockMovements = stockMovements;
window.expenses = expenses;

async function initializeTYSApp() {
    if (window.__tysAppInitialized) return;
    window.__tysAppInitialized = true;

    try {
        const state = typeof loadState === "function" ? loadState() : {};

        inventory = typeof normalizeInventory === "function"
            ? normalizeInventory(state.inventory || [])
            : (Array.isArray(state.inventory) ? state.inventory : []);

        sales = Array.isArray(state.sales) ? state.sales : [];
        suppliers = typeof getSuppliers === "function" ? getSuppliers() : [];
        purchases = typeof getPurchases === "function" ? getPurchases() : [];
        stockMovements = typeof getStockMovements === "function" ? getStockMovements() : [];
        expenses = typeof getExpenses === "function" ? getExpenses() : [];

        window.inventory = inventory;
        window.sales = sales;
        window.suppliers = suppliers;
        window.purchases = purchases;
        window.stockMovements = stockMovements;
        window.expenses = expenses;

        // Modules that do not initialize themselves. Other page modules
        // attach their own guarded DOMContentLoaded handlers.
        const initializers = [
            "initializeInventoryModule",
            "initializeSalesModule"
        ];

        for (const functionName of initializers) {
            const fn = window[functionName];
            if (typeof fn === "function") {
                await fn();
            }
        }

    } catch (error) {
        window.__tysAppInitialized = false;
        console.error("TYS POS initialization failed:", error);
    }
}

document.addEventListener("DOMContentLoaded", initializeTYSApp, { once: true });
