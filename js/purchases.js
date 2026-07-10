//======================================================
// TYS POS v3
// PURCHASES MODULE
// PART 1
//======================================================

//------------------------------------------------------
// GLOBAL
//------------------------------------------------------

//------------------------------------------------------
// SUPPLIER DROPDOWN
//------------------------------------------------------

function populateSupplierDropdown() {

    const select = document.getElementById("purchase-supplier");

    if (!select) return;

    const supplierList = getSuppliers();

    select.innerHTML = `
        <option value="">
            Select Supplier
        </option>
    `;

    supplierList.forEach(supplier => {

        const option = document.createElement("option");

        option.value = supplier.id;

        option.textContent = supplier.name;

        select.appendChild(option);

    });

}

//------------------------------------------------------
// PRODUCT DROPDOWN
//------------------------------------------------------

function populateProductDropdown() {

    const select = document.getElementById("purchase-product");

    if (!select) return;

    const state = loadState();

    const productList = state.inventory || [];

    select.innerHTML = `
        <option value="">
            Select Product
        </option>
    `;

    productList.forEach(product => {

        const option = document.createElement("option");

        option.value = product.id;

        option.textContent = product.name;

        select.appendChild(option);

    });

}
//------------------------------------------------------
// SAVE PURCHASE
//------------------------------------------------------

function savePurchase() {

    const supplierId = document.getElementById("purchase-supplier").value;
    const productId = document.getElementById("purchase-product").value;
    const quantity = Number(document.getElementById("purchase-qty").value);
    const cost = Number(document.getElementById("purchase-cost").value);
    const invoice = document.getElementById("purchase-invoice").value.trim();

    const dateInput = document.getElementById("purchase-date");
    const date = dateInput && dateInput.value
        ? new Date(dateInput.value).toISOString()
        : new Date().toISOString();

    if (!supplierId || !productId || quantity <= 0 || cost <= 0) {
        alert("Please complete all required fields.");
        return;
    }

    const suppliers = getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);

    const state = loadState();
    const product = state.inventory.find(p => p.id === productId);

    if (!product) {
        alert("Product not found.");
        return;
    }

    product.stock = Number(product.stock || 0) + quantity;
    product.cost = cost;

    const purchase = {
        id: generateId("PUR-"),
        supplierId,
        supplierName: supplier ? supplier.name : "",
        productId,
        productName: product.name,
        quantity,
        cost,
        total: quantity * cost,
        invoice,
        date
    };

    purchases = getPurchases();
    purchases.unshift(purchase);

    savePurchases(purchases);

    saveState({
        inventory: state.inventory,
        sales: state.sales || []
    });

    recordStockMovement({
        productId: product.id,
        productName: product.name,
        type: "Purchase",
        quantity,
        notes: invoice || "Purchase recorded"
    });

    renderPurchaseHistory();
    populateProductDropdown();

    if (typeof renderInventory === "function") {
        renderInventory();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

    document.getElementById("purchase-form").reset();

}
//------------------------------------------------------
// RENDER PURCHASE HISTORY
//------------------------------------------------------

function renderPurchaseHistory(search = "") {

    const container = document.getElementById("purchase-history");

    if (!container) return;

    purchases = getPurchases();

    const keyword = search.trim().toLowerCase();

    const filtered = purchases.filter(purchase => {

        return (
            purchase.supplierName.toLowerCase().includes(keyword) ||
            purchase.productName.toLowerCase().includes(keyword) ||
            (purchase.invoice || "").toLowerCase().includes(keyword)
        );

    });

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

    container.innerHTML = filtered.map(purchase => `

        <tr>

            <td>${formatDate(purchase.date)}</td>

            <td>${purchase.supplierName || "-"}</td>

            <td>${purchase.productName || "-"}</td>

            <td>${purchase.invoice || "-"}</td>

            <td>${purchase.quantity}</td>

            <td>${formatCurrency(purchase.cost)}</td>

            <td>${formatCurrency(purchase.total)}</td>

            <td>
                <button
                    class="secondary-btn edit-purchase"
                    data-id="${purchase.id}">
                    Edit
                </button>

                <button
                    class="danger-btn delete-purchase"
                    data-id="${purchase.id}">
                    Delete
                </button>
            </td>

        </tr>

    `).join("");

    document.querySelectorAll(".edit-purchase").forEach(button => {

        button.addEventListener("click", () => {

            editPurchase(button.dataset.id);

        });

    });

    document.querySelectorAll(".delete-purchase").forEach(button => {

        button.addEventListener("click", () => {

            deletePurchase(button.dataset.id);

        });

    });

}
//------------------------------------------------------
// EDIT PURCHASE
//------------------------------------------------------

function editPurchase(purchaseId) {

    purchases = getPurchases();

    const purchase = purchases.find(p => p.id === purchaseId);

    if (!purchase) return;

    document.getElementById("purchase-supplier").value = purchase.supplierId;
    document.getElementById("purchase-product").value = purchase.productId;
    document.getElementById("purchase-qty").value = purchase.quantity;
    document.getElementById("purchase-cost").value = purchase.cost;
    document.getElementById("purchase-invoice").value = purchase.invoice || "";

    const dateInput = document.getElementById("purchase-date");

    if (dateInput && purchase.date) {
        dateInput.value = purchase.date.split("T")[0];
    }

    const state = loadState();

    const product = state.inventory.find(p => p.id === purchase.productId);

    if (product) {
        product.stock = Number(product.stock || 0) - Number(purchase.quantity || 0);

        if (product.stock < 0) {
            product.stock = 0;
        }
    }

    purchases = purchases.filter(p => p.id !== purchaseId);

    savePurchases(purchases);

    saveState({
        inventory: state.inventory,
        sales: state.sales || []
    });

    renderPurchaseHistory();
    populateProductDropdown();

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

}

//------------------------------------------------------
// DELETE PURCHASE
//------------------------------------------------------

function deletePurchase(purchaseId) {

    purchases = getPurchases();

    const purchase = purchases.find(p => p.id === purchaseId);

    if (!purchase) return;

    if (!confirm(`Delete purchase for "${purchase.productName}"?`)) return;

    const state = loadState();

    const product = state.inventory.find(p => p.id === purchase.productId);

    if (product) {
        product.stock = Number(product.stock || 0) - Number(purchase.quantity || 0);

        if (product.stock < 0) {
            product.stock = 0;
        }
    }

    purchases = purchases.filter(p => p.id !== purchaseId);

    savePurchases(purchases);

    saveState({
        inventory: state.inventory,
        sales: state.sales || []
    });

    renderPurchaseHistory();
    populateProductDropdown();

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

}
//------------------------------------------------------
// PURCHASE SEARCH
//------------------------------------------------------

function initializePurchaseSearch() {

    const search = document.getElementById("purchase-search");

    if (!search) return;

    search.addEventListener("input", () => {

        renderPurchaseHistory(search.value);

    });

    const clear = document.getElementById("clear-purchase-search");

    if (clear) {

        clear.addEventListener("click", () => {

            search.value = "";

            renderPurchaseHistory();

        });

    }

}

//------------------------------------------------------
// PURCHASE SUMMARY
//------------------------------------------------------

function updatePurchaseSummary() {

    const count = document.getElementById("purchase-count");

    const total = document.getElementById("purchase-total");

    purchases = getPurchases();

    if (count) {
        count.textContent = purchases.length;
    }

    if (total) {

        const amount = purchases.reduce((sum, purchase) => {

            return sum + Number(purchase.total || 0);

        }, 0);

        total.textContent = formatCurrency(amount);

    }

}

//------------------------------------------------------
// EXPORT PURCHASES
//------------------------------------------------------

function exportPurchasesCSV() {

    purchases = getPurchases();

    const rows = [
        ["Date", "Supplier", "Product", "Invoice", "Quantity", "Cost", "Total"]
    ];

    purchases.forEach(purchase => {

        rows.push([
            formatDate(purchase.date),
            purchase.supplierName || "",
            purchase.productName || "",
            purchase.invoice || "",
            purchase.quantity,
            purchase.cost,
            purchase.total
        ]);

    });

    downloadCSV("purchases.csv", rows);

}

//------------------------------------------------------
// INITIALIZE PURCHASES MODULE
//------------------------------------------------------

function initializePurchasesModule() {

    purchases = getPurchases();

    populateSupplierDropdown();

    populateProductDropdown();

    renderPurchaseHistory();

    updatePurchaseSummary();

    initializePurchaseSearch();

    const form = document.getElementById("purchase-form");

    if (form) {

        form.addEventListener("submit", e => {

            e.preventDefault();

            savePurchase();

            updatePurchaseSummary();

        });

    }

    const exportButton = document.getElementById("export-purchases-btn");

    if (exportButton) {

        exportButton.addEventListener("click", exportPurchasesCSV);

    }

}

//------------------------------------------------------
// REFRESH PURCHASES
//------------------------------------------------------

function refreshPurchases() {

    purchases = getPurchases();

    populateSupplierDropdown();

    populateProductDropdown();

    renderPurchaseHistory();

    updatePurchaseSummary();

}