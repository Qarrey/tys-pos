//======================================================
// TYS POS v3
// PURCHASES MODULE
//======================================================


//------------------------------------------------------
// SUPPLIER DROPDOWN
//------------------------------------------------------

function populateSupplierDropdown() {

    const select =
        document.getElementById("purchase-supplier");

    if (!select) return;

    const supplierList =
        typeof getSuppliers === "function"
            ? getSuppliers()
            : [];

    select.innerHTML = `
        <option value="">
            No Supplier / Optional
        </option>
    `;

    supplierList.forEach(supplier => {

        const option =
            document.createElement("option");

        option.value = supplier.id;

        option.textContent =
            supplier.name || "Unnamed Supplier";

        select.appendChild(option);

    });

}


//------------------------------------------------------
// PRODUCT DROPDOWN
//------------------------------------------------------

function populateProductDropdown() {

    const select =
        document.getElementById("purchase-product");

    if (!select) return;

    const state =
        typeof loadState === "function"
            ? loadState()
            : {};

    const productList =
        state.inventory || [];

    select.innerHTML = `
        <option value="">
            Select Product
        </option>
    `;

    productList
        .slice()
        .sort((a, b) => {

            return String(a.name || "")
                .localeCompare(
                    String(b.name || "")
                );

        })
        .forEach(product => {

            const option =
                document.createElement("option");

            option.value = product.id;

            option.textContent =
                product.name || "Unnamed Product";

            select.appendChild(option);

        });

}


//------------------------------------------------------
// SAVE PURCHASE
//------------------------------------------------------

function savePurchase() {

    const supplierSelect =
        document.getElementById(
            "purchase-supplier"
        );

    const productSelect =
        document.getElementById(
            "purchase-product"
        );

    const quantityInput =
        document.getElementById(
            "purchase-qty"
        );

    const costInput =
        document.getElementById(
            "purchase-cost"
        );

    const invoiceInput =
        document.getElementById(
            "purchase-invoice"
        );

    const dateInput =
        document.getElementById(
            "purchase-date"
        );


    const supplierId =
        supplierSelect
            ? supplierSelect.value
            : "";

    const productId =
        productSelect
            ? productSelect.value
            : "";

    const quantity =
        quantityInput
            ? Number(quantityInput.value)
            : 0;

    const cost =
        costInput
            ? Number(costInput.value)
            : 0;

    const invoice =
        invoiceInput
            ? invoiceInput.value.trim()
            : "";


    const date =
        dateInput && dateInput.value

            ? new Date(
                `${dateInput.value}T12:00:00`
            ).toISOString()

            : new Date().toISOString();


    //--------------------------------------------------
    // VALIDATION
    //--------------------------------------------------

    if (!productId) {

        alert(
            "Please select a product."
        );

        return;

    }


    if (
        !Number.isFinite(quantity) ||
        quantity <= 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        return;

    }


    if (
        !Number.isFinite(cost) ||
        cost < 0
    ) {

        alert(
            "Please enter a valid cost price."
        );

        return;

    }


    //--------------------------------------------------
    // FIND SUPPLIER
    //--------------------------------------------------

    const supplierList =
        typeof getSuppliers === "function"
            ? getSuppliers()
            : [];


    const supplier =
        supplierId

            ? supplierList.find(
                item =>
                    String(item.id) ===
                    String(supplierId)
            )

            : null;


    //--------------------------------------------------
    // FIND PRODUCT
    //--------------------------------------------------

    const state =
        typeof loadState === "function"
            ? loadState()
            : {};


    const inventory =
        state.inventory || [];


    const product =
        inventory.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        alert(
            "Product not found. Refresh the page and try again."
        );

        return;

    }


    //--------------------------------------------------
    // UPDATE STOCK AND COST
    //--------------------------------------------------

    product.stock =
        Number(product.stock || 0) +
        quantity;


    product.cost = cost;


    //--------------------------------------------------
    // CREATE PURCHASE
    //--------------------------------------------------

    const purchase = {

        id:
            typeof generateId === "function"

                ? generateId("PUR-")

                : `PUR-${Date.now()}`,

        supplierId:
            supplier
                ? supplier.id
                : "",

        supplierName:
            supplier
                ? supplier.name
                : "Not specified",

        productId:
            product.id,

        productName:
            product.name || "Unknown Product",

        quantity,

        cost,

        total:
            quantity * cost,

        invoice,

        date

    };


    //--------------------------------------------------
    // SAVE PURCHASE
    //--------------------------------------------------

    purchases =
        typeof getPurchases === "function"

            ? getPurchases()

            : [];


    purchases.unshift(
        purchase
    );


    if (
        typeof savePurchases ===
        "function"
    ) {

        savePurchases(
            purchases
        );

    }


    //--------------------------------------------------
    // SAVE UPDATED INVENTORY
    //--------------------------------------------------

    if (
        typeof saveState ===
        "function"
    ) {

        saveState({

            ...state,

            inventory,

            sales:
                state.sales || []

        });

    }


    //--------------------------------------------------
    // STOCK MOVEMENT
    //--------------------------------------------------

    if (
        typeof recordStockMovement ===
        "function"
    ) {

        recordStockMovement({

            productId:
                product.id,

            productName:
                product.name,

            type:
                "Purchase",

            quantity,

            notes:
                invoice ||
                "Purchase recorded"

        });

    }


    //--------------------------------------------------
    // REFRESH PAGE
    //--------------------------------------------------

    renderPurchaseHistory();

    updatePurchaseSummary();

    populateProductDropdown();


   populateSupplierDropdown();

populateProductDropdown();


//--------------------------------------------------
// SAVE PURCHASE TO SUPABASE
//--------------------------------------------------

if (
    typeof savePurchaseToSupabase ===
    "function"
) {

    savePurchaseToSupabase(purchase)
        .then(result => {

            if (result) {

                console.log(
                    "Purchase saved locally and online."
                );

            }

        })
        .catch(error => {

            console.error(
                "Cloud purchase save failed:",
                error
            );

        });

}


alert(
    "Purchase saved successfully."
);
}

//------------------------------------------------------
// RENDER PURCHASE HISTORY
//------------------------------------------------------

function renderPurchaseHistory(
    search = ""
) {

    const container =
        document.getElementById(
            "purchase-history"
        );


    if (!container) return;


    purchases =
        typeof getPurchases === "function"

            ? getPurchases()

            : [];


    const keyword =
        String(search || "")
            .trim()
            .toLowerCase();


    const filtered =
        purchases.filter(
            purchase => {

                const supplierName =
                    String(
                        purchase.supplierName ||
                        ""
                    ).toLowerCase();


                const productName =
                    String(
                        purchase.productName ||
                        ""
                    ).toLowerCase();


                const invoice =
                    String(
                        purchase.invoice ||
                        ""
                    ).toLowerCase();


                return (

                    supplierName
                        .includes(keyword)

                    ||

                    productName
                        .includes(keyword)

                    ||

                    invoice
                        .includes(keyword)

                );

            }
        );


    if (!filtered.length) {

        container.innerHTML = `

            <tr>

                <td colspan="8">

                    <div class="empty-state">

                        No purchases recorded.

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    container.innerHTML =
        filtered.map(
            purchase => `

            <tr>

                <td>

                    ${
                        typeof formatDate ===
                        "function"

                            ? formatDate(
                                purchase.date
                            )

                            : purchase.date
                    }

                </td>


                <td>

                    ${
                        purchase.supplierName ||
                        "Not specified"
                    }

                </td>


                <td>

                    ${
                        purchase.productName ||
                        "-"
                    }

                </td>


                <td>

                    ${
                        purchase.invoice ||
                        "-"
                    }

                </td>


                <td>

                    ${
                        Number(
                            purchase.quantity ||
                            0
                        )
                    }

                </td>


                <td>

                    ${
                        typeof formatCurrency ===
                        "function"

                            ? formatCurrency(
                                purchase.cost
                            )

                            : purchase.cost
                    }

                </td>


                <td>

                    ${
                        typeof formatCurrency ===
                        "function"

                            ? formatCurrency(
                                purchase.total
                            )

                            : purchase.total
                    }

                </td>


                <td>

                    <button

                        class="
                            secondary-btn
                            edit-purchase
                        "

                        type="button"

                        data-id="
                            ${purchase.id}
                        ">

                        Edit

                    </button>


                    <button

                        class="
                            danger-btn
                            delete-purchase
                        "

                        type="button"

                        data-id="
                            ${purchase.id}
                        ">

                        Delete

                    </button>

                </td>

            </tr>

        `).join("");


    document
        .querySelectorAll(
            ".edit-purchase"
        )
        .forEach(
            button => {

                button
                    .addEventListener(
                        "click",
                        () => {

                            editPurchase(
                                button.dataset.id
                            );

                        }
                    );

            }
        );


    document
        .querySelectorAll(
            ".delete-purchase"
        )
        .forEach(
            button => {

                button
                    .addEventListener(
                        "click",
                        () => {

                            deletePurchase(
                                button.dataset.id
                            );

                        }
                    );

            }
        );

}


//------------------------------------------------------
// EDIT PURCHASE
//------------------------------------------------------

function editPurchase(
    purchaseId
) {

    purchases =
        typeof getPurchases === "function"

            ? getPurchases()

            : [];


    const purchase =
        purchases.find(

            item =>

                String(item.id) ===
                String(purchaseId)

        );


    if (!purchase) return;


    const supplierSelect =
        document.getElementById(
            "purchase-supplier"
        );


    const productSelect =
        document.getElementById(
            "purchase-product"
        );


    const quantityInput =
        document.getElementById(
            "purchase-qty"
        );


    const costInput =
        document.getElementById(
            "purchase-cost"
        );


    const invoiceInput =
        document.getElementById(
            "purchase-invoice"
        );


    const dateInput =
        document.getElementById(
            "purchase-date"
        );


    if (supplierSelect) {

        supplierSelect.value =
            purchase.supplierId || "";

    }


    if (productSelect) {

        productSelect.value =
            purchase.productId || "";

    }


    if (quantityInput) {

        quantityInput.value =
            purchase.quantity || "";

    }


    if (costInput) {

        costInput.value =
            purchase.cost || "";

    }


    if (invoiceInput) {

        invoiceInput.value =
            purchase.invoice || "";

    }


    if (
        dateInput &&
        purchase.date
    ) {

        dateInput.value =
            purchase.date
                .split("T")[0];

    }


    //--------------------------------------------------
    // REVERSE OLD STOCK
    //--------------------------------------------------

    const state =
        typeof loadState === "function"

            ? loadState()

            : {};


    const inventory =
        state.inventory || [];


    const product =
        inventory.find(

            item =>

                String(item.id) ===
                String(
                    purchase.productId
                )

        );


    if (product) {

        product.stock =

            Number(
                product.stock || 0
            )

            -

            Number(
                purchase.quantity || 0
            );


        if (
            product.stock < 0
        ) {

            product.stock = 0;

        }

    }


    //--------------------------------------------------
    // REMOVE OLD PURCHASE
    //--------------------------------------------------

    purchases =
        purchases.filter(

            item =>

                String(item.id) !==
                String(purchaseId)

        );


    if (
        typeof savePurchases ===
        "function"
    ) {

        savePurchases(
            purchases
        );

    }


    if (
        typeof saveState ===
        "function"
    ) {

        saveState({

            ...state,

            inventory,

            sales:
                state.sales || []

        });

    }


    renderPurchaseHistory();

    updatePurchaseSummary();

    populateProductDropdown();


    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {

        updateDashboardMetrics();

    }

}


//------------------------------------------------------
// DELETE PURCHASE
//------------------------------------------------------

function deletePurchase(
    purchaseId
) {

    purchases =
        typeof getPurchases === "function"

            ? getPurchases()

            : [];


    const purchase =
        purchases.find(

            item =>

                String(item.id) ===
                String(purchaseId)

        );


    if (!purchase) return;


    const confirmed =
        confirm(

            `Delete purchase for "${

                purchase.productName ||
                "this product"

            }"?`

        );


    if (!confirmed) return;


    //--------------------------------------------------
    // REDUCE STOCK
    //--------------------------------------------------

    const state =
        typeof loadState === "function"

            ? loadState()

            : {};


    const inventory =
        state.inventory || [];


    const product =
        inventory.find(

            item =>

                String(item.id) ===
                String(
                    purchase.productId
                )

        );


    if (product) {

        product.stock =

            Number(
                product.stock || 0
            )

            -

            Number(
                purchase.quantity || 0
            );


        if (
            product.stock < 0
        ) {

            product.stock = 0;

        }

    }


    //--------------------------------------------------
    // REMOVE PURCHASE
    //--------------------------------------------------

    purchases =
        purchases.filter(

            item =>

                String(item.id) !==
                String(purchaseId)

        );


    if (
        typeof savePurchases ===
        "function"
    ) {

        savePurchases(
            purchases
        );

    }


    if (
        typeof saveState ===
        "function"
    ) {

        saveState({

            ...state,

            inventory,

            sales:
                state.sales || []

        });

    }


    renderPurchaseHistory();

    updatePurchaseSummary();

    populateProductDropdown();


    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {

        updateDashboardMetrics();

    }

}


//------------------------------------------------------
// PURCHASE SEARCH
//------------------------------------------------------

function initializePurchaseSearch() {

    const search =
        document.getElementById(
            "purchase-search"
        );


    if (!search) return;


    search.addEventListener(

        "input",

        () => {

            renderPurchaseHistory(
                search.value
            );

        }

    );


    const clear =
        document.getElementById(
            "clear-purchase-search"
        );


    if (clear) {

        clear.addEventListener(

            "click",

            () => {

                search.value = "";

                renderPurchaseHistory();

            }

        );

    }

}


//------------------------------------------------------
// PURCHASE SUMMARY
//------------------------------------------------------

function updatePurchaseSummary() {

    const count =
        document.getElementById(
            "purchase-count"
        );


    const total =
        document.getElementById(
            "purchase-total"
        );


    purchases =
        typeof getPurchases === "function"

            ? getPurchases()

            : [];


    if (count) {

        count.textContent =
            purchases.length;

    }


    if (total) {

        const amount =
            purchases.reduce(

                (
                    sum,
                    purchase
                ) => {

                    return (

                        sum

                        +

                        Number(
                            purchase.total ||
                            0
                        )

                    );

                },

                0

            );


        total.textContent =

            typeof formatCurrency ===
            "function"

                ? formatCurrency(
                    amount
                )

                : amount;

    }

}


//------------------------------------------------------
// EXPORT PURCHASES
//------------------------------------------------------

function exportPurchasesCSV() {

    purchases =
        typeof getPurchases === "function"

            ? getPurchases()

            : [];


    const rows = [

        [

            "Date",

            "Supplier",

            "Product",

            "Invoice",

            "Quantity",

            "Cost",

            "Total"

        ]

    ];


    purchases.forEach(

        purchase => {

            rows.push([

                typeof formatDate ===
                "function"

                    ? formatDate(
                        purchase.date
                    )

                    : purchase.date,

                purchase.supplierName ||
                "Not specified",

                purchase.productName ||
                "",

                purchase.invoice ||
                "",

                purchase.quantity,

                purchase.cost,

                purchase.total

            ]);

        }

    );


    if (
        typeof downloadCSV ===
        "function"
    ) {

        downloadCSV(

            "purchases.csv",

            rows

        );

    }

}


//------------------------------------------------------
// INITIALIZE PURCHASES MODULE
//------------------------------------------------------

function initializePurchasesModule() {

    purchases =

        typeof getPurchases ===
        "function"

            ? getPurchases()

            : [];


    populateSupplierDropdown();

    populateProductDropdown();

    renderPurchaseHistory();

    updatePurchaseSummary();

    initializePurchaseSearch();


    const form =
        document.getElementById(
            "purchase-form"
        );


    if (form) {

        form.addEventListener(

            "submit",

            event => {

                event.preventDefault();

                savePurchase();

            }

        );

    }


    const exportButton =
        document.getElementById(
            "export-purchases-btn"
        );


    if (exportButton) {

        exportButton.addEventListener(

            "click",

            exportPurchasesCSV

        );

    }

}


//------------------------------------------------------
// REFRESH PURCHASES
//------------------------------------------------------

function refreshPurchases() {

    purchases =

        typeof getPurchases ===
        "function"

            ? getPurchases()

            : [];


    populateSupplierDropdown();

    populateProductDropdown();

    renderPurchaseHistory();

    updatePurchaseSummary();

}


//------------------------------------------------------
// AUTO START
//------------------------------------------------------

document.addEventListener(

    "DOMContentLoaded",

    () => {

        if (

            document.getElementById(
                "purchase-form"
            )

        ) {

            initializePurchasesModule();

        }

    }

);