//======================================================
// TYS POS v3
// UTILITY FUNCTIONS
//======================================================

//------------------------------------------------------
// CURRENCY
//------------------------------------------------------

const CURRENCY = "Ksh";

function formatCurrency(value = 0) {

    return `${CURRENCY} ${Number(value).toLocaleString(
        undefined,
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;

}

//------------------------------------------------------
// DATE & TIME
//------------------------------------------------------

function formatDate(date) {

    return new Date(date).toLocaleDateString();

}

function formatDateTime(date) {

    return new Date(date).toLocaleString();

}

function today() {

    return new Date().toISOString().split("T")[0];

}

//------------------------------------------------------
// ID GENERATOR
//------------------------------------------------------

function generateId(prefix = "") {

    return `${prefix}${Date.now()}${Math.floor(Math.random()*1000)}`;

}

//------------------------------------------------------
// FEEDBACK MESSAGE
//------------------------------------------------------

function showFeedback(message, type = "success") {

    const feedback = document.getElementById("feedback-message")
        || document.getElementById("feedback");

    if (!feedback) return;

    feedback.textContent = message;

    feedback.className = `feedback-message ${type}`;

    setTimeout(() => {

        feedback.textContent = "";

        feedback.className = "feedback-message";

    }, 3000);

}

//------------------------------------------------------
// CONFIRM
//------------------------------------------------------

function confirmDelete(message = "Delete this item?") {

    return confirm(message);

}

//------------------------------------------------------
// NUMBERS
//------------------------------------------------------

function toNumber(value) {

    return Number(value) || 0;

}

//------------------------------------------------------
// INVENTORY HELPERS
//------------------------------------------------------

function findProduct(id) {

    return inventory.find(product => product.id === id);

}

function updateProduct(product) {

    const index = inventory.findIndex(

        item => item.id === product.id

    );

    if (index !== -1) {

        inventory[index] = product;

    }

}

//------------------------------------------------------
// STOCK MOVEMENTS
//------------------------------------------------------

function addStockMovement({

    productId,

    productName,

    type,

    quantity,

    remarks = ""

}) {

    const history = getStockMovements();

    history.unshift({

        id: generateId("SM-"),

        productId,

        productName,

        type,

        quantity,

        remarks,

        date: new Date().toISOString()

    });

    saveStockMovements(history);

}

//------------------------------------------------------
// DOWNLOAD JSON
//------------------------------------------------------

function downloadJSON(filename, data) {

    const blob = new Blob(

        [

            JSON.stringify(data, null, 2)

        ],

        {

            type: "application/json"

        }

    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);

}

//------------------------------------------------------
// READ JSON FILE
//------------------------------------------------------

function readJSON(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = event => {

            try {

                resolve(JSON.parse(event.target.result));

            }

            catch (err) {

                reject(err);

            }

        };

        reader.onerror = reject;

        reader.readAsText(file);

    });

}