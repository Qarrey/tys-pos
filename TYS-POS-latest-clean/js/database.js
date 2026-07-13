//======================================================
// TYS POS v3
// DATABASE
//======================================================

//------------------------------------------------------
// STORAGE KEYS
//------------------------------------------------------

const STORAGE_KEY = "tys-pos-state";
const SUPPLIER_KEY = "tys-pos-suppliers";
const PURCHASE_KEY = "tys-pos-purchases";
const EXPENSE_KEY = "tys-pos-expenses";
const STOCK_KEY = "tys-pos-stock-movements";

//------------------------------------------------------
// DEFAULT DATABASE
//------------------------------------------------------

const DEFAULT_STATE = {

    inventory: [],

    sales: []

};

//------------------------------------------------------
// LOAD DATABASE
//------------------------------------------------------

function loadState() {

    try {

        const state = JSON.parse(

            localStorage.getItem(STORAGE_KEY)

        );

        if (!state) {

            return structuredClone(DEFAULT_STATE);

        }

        return {

            inventory: state.inventory || [],

            sales: state.sales || []

        };

    }

    catch (error) {

        console.error(error);

        return structuredClone(DEFAULT_STATE);

    }

}

//------------------------------------------------------
// SAVE DATABASE
//------------------------------------------------------

function saveState(state) {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify({

            inventory: state.inventory,

            sales: state.sales

        })

    );

}
//------------------------------------------------------
// SUPPLIERS
//------------------------------------------------------

function getSuppliers() {

    try {

        return JSON.parse(

            localStorage.getItem(SUPPLIER_KEY)

        ) || [];

    }

    catch (error) {

        console.error(error);

        return [];

    }

}

function saveSuppliers(suppliers) {

    localStorage.setItem(

        SUPPLIER_KEY,

        JSON.stringify(suppliers)

    );

}

//------------------------------------------------------
// PURCHASES
//------------------------------------------------------

function getPurchases() {

    try {

        return JSON.parse(

            localStorage.getItem(PURCHASE_KEY)

        ) || [];

    }

    catch (error) {

        console.error(error);

        return [];

    }

}

function savePurchases(purchases) {

    localStorage.setItem(

        PURCHASE_KEY,

        JSON.stringify(purchases)

    );

}
//------------------------------------------------------
// EXPENSES
//------------------------------------------------------

function getExpenses() {

    try {

        return JSON.parse(

            localStorage.getItem(EXPENSE_KEY)

        ) || [];

    }

    catch (error) {

        console.error(error);

        return [];

    }

}

function saveExpenses(expenses) {

    localStorage.setItem(

        EXPENSE_KEY,

        JSON.stringify(expenses)

    );

}

//------------------------------------------------------
// STOCK MOVEMENTS
//------------------------------------------------------

function getStockMovements() {

    try {

        return JSON.parse(

            localStorage.getItem(STOCK_KEY)

        ) || [];

    }

    catch (error) {

        console.error(error);

        return [];

    }

}

function saveStockMovements(stockMovements) {

    localStorage.setItem(

        STOCK_KEY,

        JSON.stringify(stockMovements)

    );

}
//------------------------------------------------------
// PRODUCT HELPERS
//------------------------------------------------------

function getProductById(productId) {

    const state = loadState();

    return state.inventory.find(

        product => product.id === productId

    );

}

function saveInventory(inventory) {

    const state = loadState();

    state.inventory = inventory;

    saveState(state);

}

function saveSales(sales) {

    const state = loadState();

    state.sales = sales;

    saveState(state);

}

//------------------------------------------------------
// STOCK MOVEMENTS
//------------------------------------------------------

function recordStockMovement({

    productId,

    productName,

    type,

    quantity,

    notes = ""

}) {

    const movements = getStockMovements();

    movements.unshift({

        id: generateId(),

        productId,

        productName,

        type,

        quantity,

        notes,

        date: new Date().toISOString()

    });

    saveStockMovements(movements);

}
//------------------------------------------------------
// DATABASE BACKUP
//------------------------------------------------------

function exportDatabase() {

    const backup = {

        inventory: loadState().inventory,

        sales: loadState().sales,

        suppliers: getSuppliers(),

        purchases: getPurchases(),

        expenses: getExpenses(),

        stockMovements: getStockMovements(),

        exportedAt: new Date().toISOString(),

        version: "3.0"

    };

    return backup;

}

//------------------------------------------------------
// DATABASE RESTORE
//------------------------------------------------------

function importDatabase(data) {

    if (!data) return false;

    saveState({

        inventory: data.inventory || [],

        sales: data.sales || []

    });

    saveSuppliers(

        data.suppliers || []

    );

    savePurchases(

        data.purchases || []

    );

    saveExpenses(

        data.expenses || []

    );

    saveStockMovements(

        data.stockMovements || []

    );

    return true;

}

//------------------------------------------------------
// CLEAR DATABASE
//------------------------------------------------------

function resetDatabase() {

    localStorage.removeItem(STORAGE_KEY);

    localStorage.removeItem(SUPPLIER_KEY);

    localStorage.removeItem(PURCHASE_KEY);

    localStorage.removeItem(EXPENSE_KEY);

    localStorage.removeItem(STOCK_KEY);

}
//------------------------------------------------------
// INITIALIZE DATABASE
//------------------------------------------------------

(function initializeDatabase() {

    const state = loadState();

    // Create database if it doesn't exist

    saveState({

        inventory: state.inventory || [],

        sales: state.sales || []

    });

    // Create empty storage if missing

    if (!localStorage.getItem(SUPPLIER_KEY)) {

        saveSuppliers([]);

    }

    if (!localStorage.getItem(PURCHASE_KEY)) {

        savePurchases([]);

    }

    if (!localStorage.getItem(EXPENSE_KEY)) {

        saveExpenses([]);

    }

    if (!localStorage.getItem(STOCK_KEY)) {

        saveStockMovements([]);

    }

})();

//------------------------------------------------------
// DATABASE VERSION
//------------------------------------------------------

const DATABASE_VERSION = "3.0.0";