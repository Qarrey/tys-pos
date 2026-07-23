//======================================================
// TYS POS v3
// PURCHASES MODULE
//======================================================

let editingPurchaseId = null;

function normalizePurchaseId(value) {
    return String(value ?? "").trim();
}

function getCurrentPurchases() {
    if (Array.isArray(purchases) && purchases.length) {
        return purchases;
    }

    return typeof getPurchases === "function"
        ? getPurchases()
        : [];
}

function findPurchaseById(purchaseId) {
    const normalizedId = normalizePurchaseId(purchaseId);
    const list = getCurrentPurchases();

    return list.find(item =>
        normalizePurchaseId(item?.id) === normalizedId ||
        normalizePurchaseId(item?.cloudId) === normalizedId
    ) || null;
}


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

async function savePurchase() {
    const supplierSelect = document.getElementById("purchase-supplier");
    const productSelect = document.getElementById("purchase-product");
    const quantityInput = document.getElementById("purchase-qty");
    const costInput = document.getElementById("purchase-cost");
    const sellingPriceInput = document.getElementById("purchase-selling-price");
    const updateSellingPriceInput = document.getElementById("purchase-update-selling-price");
    const invoiceInput = document.getElementById("purchase-invoice");
    const dateInput = document.getElementById("purchase-date");

    const supplierId = supplierSelect ? supplierSelect.value : "";
    const productId = productSelect ? productSelect.value : "";
    const quantity = quantityInput ? Number(quantityInput.value) : 0;
    const cost = costInput ? Number(costInput.value) : 0;
    const sellingPriceText = sellingPriceInput ? sellingPriceInput.value.trim() : "";
    const sellingPrice = sellingPriceText === "" ? null : Number(sellingPriceText);
    const shouldUpdateSellingPrice = Boolean(updateSellingPriceInput && updateSellingPriceInput.checked);
    const invoice = invoiceInput ? invoiceInput.value.trim() : "";
    const date = dateInput && dateInput.value
        ? new Date(`${dateInput.value}T12:00:00`).toISOString()
        : new Date().toISOString();

    if (!productId) return alert("Please select a product.");
    if (!Number.isFinite(quantity) || quantity <= 0) return alert("Please enter a valid quantity.");
    if (!Number.isFinite(cost) || cost < 0) return alert("Please enter a valid cost price.");
    if (shouldUpdateSellingPrice && (!Number.isFinite(sellingPrice) || sellingPrice < 0)) {
        return alert("Enter a valid selling price or untick Update selling price.");
    }

    const supplierList = typeof getSuppliers === "function" ? getSuppliers() : [];
    const supplier = supplierId
        ? supplierList.find(item => String(item.id) === String(supplierId))
        : null;

    const state = typeof loadState === "function" ? loadState() : {};
    const inventory = state.inventory || [];
    const product = inventory.find(item => String(item.id) === String(productId));
    if (!product) return alert("Product not found. Refresh the page and try again.");

    purchases = typeof getPurchases === "function" ? getPurchases() : [];
    const oldPurchase = editingPurchaseId
        ? purchases.find(item => String(item.id) === String(editingPurchaseId))
        : null;

    if (editingPurchaseId && !oldPurchase) {
        editingPurchaseId = null;
        return alert("The purchase could not be found. Refresh the page and try again.");
    }

    if (oldPurchase) {
        const oldProduct = inventory.find(item => String(item.id) === String(oldPurchase.productId));
        if (!oldProduct) return alert("The original product could not be found.");

        if (String(oldPurchase.productId) === String(productId)) {
            product.stock = Number(product.stock || 0) + quantity - Number(oldPurchase.quantity || 0);
        } else {
            oldProduct.stock = Math.max(0, Number(oldProduct.stock || 0) - Number(oldPurchase.quantity || 0));
            product.stock = Number(product.stock || 0) + quantity;
        }
    } else {
        product.stock = Number(product.stock || 0) + quantity;
    }

    product.cost = cost;
    if (shouldUpdateSellingPrice) {
        product.sellingPrice = sellingPrice;
        product.price = sellingPrice;
    }

    const purchase = {
        id: oldPurchase
            ? oldPurchase.id
            : (typeof generateId === "function" ? generateId("PUR-") : `PUR-${Date.now()}`),
        supplierId: supplier ? supplier.id : "",
        supplierName: supplier ? supplier.name : "Not specified",
        productId: product.id,
        productName: product.name || "Unknown Product",
        quantity,
        cost,
        sellingPriceUpdated: shouldUpdateSellingPrice ? sellingPrice : null,
        total: quantity * cost,
        invoice,
        date,
        editedAt: oldPurchase ? new Date().toISOString() : null
    };

    if (oldPurchase) {
        const index = purchases.findIndex(item => String(item.id) === String(oldPurchase.id));
        purchases[index] = purchase;
    } else {
        purchases.unshift(purchase);
    }

    if (typeof savePurchases === "function") savePurchases(purchases);
    if (typeof saveState === "function") {
        saveState({ ...state, inventory, sales: state.sales || [] });
    }

    if (oldPurchase) {
        recordPurchaseCorrection(oldPurchase, purchase);
    } else if (typeof recordStockMovement === "function") {
        recordStockMovement({
            productId: product.id,
            productName: product.name,
            type: "Purchase",
            quantity,
            notes: invoice || "Purchase recorded"
        });
    }

    try {
        if (oldPurchase && typeof updatePurchaseInSupabase === "function") {
            await updatePurchaseInSupabase(oldPurchase, purchase);
        } else if (!oldPurchase && typeof savePurchaseToSupabase === "function") {
            await savePurchaseToSupabase(purchase);
        }
    } catch (error) {
        console.error("Cloud purchase save failed:", error);
        alert("The purchase was saved on this device, but the online update failed.");
    }

    resetPurchaseForm();
    renderPurchaseHistory();
    updatePurchaseSummary();
    populateProductDropdown();
    populateSupplierDropdown();
    if (typeof updateDashboardMetrics === "function") updateDashboardMetrics();

    alert(oldPurchase ? "Purchase updated successfully." : "Purchase saved successfully.");
}

function getPurchaseEditorName() {
    const user = window.currentPOSUser || {};
    return user.fullName || user.name || user.email || "Unknown user";
}

function recordPurchaseCorrection(oldPurchase, newPurchase) {
    if (typeof getAdjustments !== "function" || typeof saveAdjustments !== "function") return;

    const quantityChange = String(oldPurchase.productId) === String(newPurchase.productId)
        ? Number(newPurchase.quantity || 0) - Number(oldPurchase.quantity || 0)
        : Number(newPurchase.quantity || 0);

    const changes = [];
    if (String(oldPurchase.productName) !== String(newPurchase.productName)) {
        changes.push(`Product: ${oldPurchase.productName} → ${newPurchase.productName}`);
    }
    if (Number(oldPurchase.quantity || 0) !== Number(newPurchase.quantity || 0)) {
        changes.push(`Quantity: ${oldPurchase.quantity} → ${newPurchase.quantity}`);
    }
    if (Number(oldPurchase.cost || 0) !== Number(newPurchase.cost || 0)) {
        changes.push(`Cost: ${oldPurchase.cost} → ${newPurchase.cost}`);
    }
    if (String(oldPurchase.supplierName || "") !== String(newPurchase.supplierName || "")) {
        changes.push(`Supplier: ${oldPurchase.supplierName || "Not specified"} → ${newPurchase.supplierName || "Not specified"}`);
    }
    if (String(oldPurchase.invoice || "") !== String(newPurchase.invoice || "")) {
        changes.push(`Invoice: ${oldPurchase.invoice || "-"} → ${newPurchase.invoice || "-"}`);
    }
    if (String(oldPurchase.date || "").slice(0, 10) !== String(newPurchase.date || "").slice(0, 10)) {
        changes.push(`Date: ${String(oldPurchase.date).slice(0, 10)} → ${String(newPurchase.date).slice(0, 10)}`);
    }

    const adjustments = getAdjustments();
    adjustments.unshift({
        id: `ADJ-${Date.now()}`,
        date: new Date().toISOString(),
        source: "Purchase edit",
        purchaseId: newPurchase.id,
        productId: newPurchase.productId,
        productName: newPurchase.productName,
        oldProductId: oldPurchase.productId,
        oldProductName: oldPurchase.productName,
        quantityChange,
        oldQuantity: Number(oldPurchase.quantity || 0),
        newQuantity: Number(newPurchase.quantity || 0),
        oldCost: Number(oldPurchase.cost || 0),
        newCost: Number(newPurchase.cost || 0),
        reason: changes.length ? changes.join("; ") : "Purchase details saved without a numerical change",
        userName: getPurchaseEditorName()
    });
    saveAdjustments(adjustments);
}

function resetPurchaseForm() {
    editingPurchaseId = null;
    const form = document.getElementById("purchase-form");
    if (form) form.reset();

    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    if (submitButton) submitButton.textContent = "Save Purchase";

    const productSelect = document.getElementById("purchase-product");
    if (productSelect) productSelect.disabled = false;

    const dateInput = document.getElementById("purchase-date");
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);
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

                        data-id="${encodeURIComponent(normalizePurchaseId(purchase.id))}">

                        Edit

                    </button>


                    <button

                        class="
                            danger-btn
                            delete-purchase
                        "

                        type="button"

                        data-id="${encodeURIComponent(normalizePurchaseId(purchase.id))}">

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

                            editPurchase(decodeURIComponent(button.dataset.id || ""));

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

                            deletePurchase(decodeURIComponent(button.dataset.id || ""));

                        }
                    );

            }
        );

}


//------------------------------------------------------
// EDIT PURCHASE
//------------------------------------------------------

function editPurchase(purchaseId) {
    const purchase = findPurchaseById(purchaseId);

    if (!purchase) {
        console.error("Purchase lookup failed", {
            requestedId: purchaseId,
            normalizedId: normalizePurchaseId(purchaseId),
            availableIds: getCurrentPurchases().map(item => normalizePurchaseId(item?.id))
        });
        return alert("Purchase not found. Refresh the page and try again.");
    }

    editingPurchaseId = purchase.id;

    const supplierSelect = document.getElementById("purchase-supplier");
    const productSelect = document.getElementById("purchase-product");
    const quantityInput = document.getElementById("purchase-qty");
    const costInput = document.getElementById("purchase-cost");
    const sellingPriceInput = document.getElementById("purchase-selling-price");
    const updateSellingPriceInput = document.getElementById("purchase-update-selling-price");
    const invoiceInput = document.getElementById("purchase-invoice");
    const dateInput = document.getElementById("purchase-date");

    if (supplierSelect) supplierSelect.value = purchase.supplierId || "";
    if (productSelect) productSelect.value = purchase.productId || "";
    if (quantityInput) quantityInput.value = purchase.quantity || "";
    if (costInput) costInput.value = purchase.cost || "";
    if (sellingPriceInput) sellingPriceInput.value = "";
    if (updateSellingPriceInput) updateSellingPriceInput.checked = false;
    if (invoiceInput) invoiceInput.value = purchase.invoice || "";
    if (dateInput && purchase.date) dateInput.value = String(purchase.date).split("T")[0];

    const form = document.getElementById("purchase-form");
    const submitButton = form ? form.querySelector('button[type="submit"]') : null;
    if (submitButton) submitButton.textContent = "Save Changes";

    form?.scrollIntoView({ behavior: "smooth", block: "start" });
}

//------------------------------------------------------
// DELETE PURCHASE
//------------------------------------------------------

function deletePurchase(purchaseId) {
    const purchase = findPurchaseById(purchaseId);

    if (!purchase) {
        console.error("Purchase delete lookup failed", {
            requestedId: purchaseId,
            normalizedId: normalizePurchaseId(purchaseId),
            availableIds: getCurrentPurchases().map(item => normalizePurchaseId(item?.id))
        });
        alert("Purchase not found. Refresh the page and try again.");
        return;
    }

    const confirmed = confirm(
        `Delete purchase for "${purchase.productName || "this product"}"?`
    );

    if (!confirmed) return;

    performPurchaseDeletion(purchase);
}

async function performPurchaseDeletion(purchase) {
    const purchaseId = normalizePurchaseId(purchase.id);
    const state = typeof loadState === "function" ? loadState() : {};
    const inventory = state.inventory || [];
    const product = inventory.find(item =>
        normalizePurchaseId(item.id) === normalizePurchaseId(purchase.productId)
    );

    if (product) {
        product.stock = Math.max(
            0,
            Number(product.stock || 0) - Number(purchase.quantity || 0)
        );
    }

    const current = getCurrentPurchases();
    purchases = current.filter(item =>
        normalizePurchaseId(item.id) !== purchaseId
    );

    if (typeof savePurchases === "function") {
        savePurchases(purchases);
    }

    if (typeof saveState === "function") {
        saveState({
            ...state,
            inventory,
            sales: state.sales || []
        });
    }

    try {
        if (typeof deletePurchaseFromSupabase === "function") {
            await deletePurchaseFromSupabase(purchase);
        }
    } catch (error) {
        console.error("Cloud purchase deletion failed:", error);
        alert("Purchase was deleted on this device, but the online deletion failed.");
    }

    renderPurchaseHistory();
    updatePurchaseSummary();
    populateProductDropdown();

    if (typeof updateDashboardMetrics === "function") {
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



        form.addEventListener("reset", () => {
            window.setTimeout(resetPurchaseForm, 0);
        });

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