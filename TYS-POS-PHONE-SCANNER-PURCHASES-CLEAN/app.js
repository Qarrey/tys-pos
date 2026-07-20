//======================================================
// TYS POS v3
// APP BOOTSTRAP
//======================================================

let inventory = [];
let sales = [];
let suppliers = [];
let purchases = [];
let stockMovements = [];
let expenses = [];

document.addEventListener("DOMContentLoaded", () => {

    const state = loadState();

    inventory =
    typeof normalizeInventory ===
    "function"
        ? normalizeInventory(
            state.inventory || []
        )
        : (
            state.inventory || []
        );
    sales = state.sales || [];

    suppliers = getSuppliers();
    purchases = getPurchases();
    stockMovements = getStockMovements();
    expenses = getExpenses();

    if (typeof initializeInventoryModule === "function") {
        initializeInventoryModule();
    }

    if (typeof initializeSuppliersModule === "function") {
        initializeSuppliersModule();
    }

    if (typeof initializePurchasesModule === "function") {
        initializePurchasesModule();
    }

    if (typeof initializeSalesModule === "function") {
        initializeSalesModule();
    }

    if (typeof initializeDashboard === "function") {
        initializeDashboard();
    }

    if (typeof refreshPurchases === "function") {
        refreshPurchases();
    }
if (typeof initializeReports === "function") {
    initializeReports();
}
});