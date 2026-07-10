//======================================================
// TYS POS v3
// INVENTORY MODULE
//======================================================

let editingProductId = null;

//------------------------------------------------------
// NORMALIZE INVENTORY
//------------------------------------------------------

function normalizeInventory(products = []) {
    return products.map(product => ({
        id: product.id || generateId("P-"),
        name: product.name || "",
        category: product.category || "",
        sku: product.sku || "",
        supplierId: product.supplierId || "",
        cost: Number(product.cost || 0),
        sellingPrice: Number(product.sellingPrice ?? product.price ?? 0),
        stock: Number(product.stock || 0),
        lowStock: Number(product.lowStock || 5)
    }));
}

//------------------------------------------------------
// SAVE INVENTORY
//------------------------------------------------------

function persistInventory() {
    saveState({
        inventory,
        sales
    });
}

//------------------------------------------------------
// GET PRODUCT
//------------------------------------------------------

function getProductById(id) {
    return inventory.find(product => product.id === id);
}

//------------------------------------------------------
// SAVE PRODUCT
//------------------------------------------------------

function saveProduct() {
    const product = {
        id: editingProductId || generateId("P-"),

        name: document.getElementById("product-name").value.trim(),

        sku: document.getElementById("product-sku").value.trim(),

        category: document.getElementById("product-category").value.trim(),

        supplierId: document.getElementById("product-supplier")?.value || "",

        cost: toNumber(document.getElementById("product-cost").value),

        sellingPrice: toNumber(
            document.getElementById("product-selling-price").value
        ),

        stock: toNumber(document.getElementById("product-stock").value),

        lowStock: toNumber(
            document.getElementById("product-low-stock").value || 5
        )
    };

    if (!product.name) {
        alert("Product name is required.");
        return;
    }

    if (editingProductId) {
        const index = inventory.findIndex(p => p.id === editingProductId);

        if (index !== -1) {
            inventory[index] = product;
        }

        showFeedback("Product updated.");
    } else {
        inventory.unshift(product);
        showFeedback("Product added.");
    }

    editingProductId = null;

    persistInventory();

    renderInventory();

    if (typeof populateProductDropdown === "function") {
        populateProductDropdown();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

    const form = document.getElementById("inventory-form");

    if (form) {
        form.reset();
    }
}

//------------------------------------------------------
// EDIT PRODUCT
//------------------------------------------------------

function editProduct(id) {

    const product = getProductById(id);

    if (!product) {
        alert("Product not found.");
        return;
    }

    editingProductId = id;

    document.getElementById("product-name").value = product.name || "";
    document.getElementById("product-sku").value = product.sku || "";
    document.getElementById("product-category").value = product.category || "";
    document.getElementById("product-cost").value = product.cost || 0;
    document.getElementById("product-selling-price").value = product.sellingPrice || 0;
    document.getElementById("product-stock").value = product.stock || 0;
    document.getElementById("product-low-stock").value = product.lowStock || 5;

    const supplier = document.getElementById("product-supplier");

    if (supplier) {
        supplier.value = product.supplierId || "";
    }

    const button = document.querySelector("#inventory-form button[type='submit']");

    if (button) {
        button.textContent = "Update Product";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}
//------------------------------------------------------
// DELETE PRODUCT
//------------------------------------------------------

function deleteProduct(id) {
    const product = getProductById(id);

    if (!product) return;

    if (!confirmDelete(`Delete "${product.name}"?`)) {
        return;
    }

    inventory = inventory.filter(product => product.id !== id);

    persistInventory();

    renderInventory();

    if (typeof populateProductDropdown === "function") {
        populateProductDropdown();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

    showFeedback("Product deleted.");
}

//------------------------------------------------------
// ADJUST STOCK
//------------------------------------------------------

function adjustStock(productId, quantity) {
    const product = getProductById(productId);

    if (!product) return;

    const reason = prompt(
        "Reason for stock adjustment?\n\nExamples:\nPurchase\nDamaged\nExpired\nReturned\nStock Count",
        quantity > 0 ? "Stock In" : "Stock Out"
    );

    if (reason === null) return;

    if (product.stock + quantity < 0) {
        alert("Insufficient stock.");
        return;
    }

    product.stock += quantity;

    recordStockMovement({
        productId: product.id,
        productName: product.name,
        type: quantity > 0 ? "Stock In" : "Stock Out",
        quantity,
        notes: reason
    });

    persistInventory();

    renderInventory();

    if (typeof populateProductDropdown === "function") {
        populateProductDropdown();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

    showFeedback("Stock updated.");
    recordStockMovement({
    productId: product.id,
    productName: product.name,
    type: quantity > 0 ? "Stock In" : "Stock Out",
    quantity,
    notes: reason
});
}

//------------------------------------------------------
// INVENTORY METRICS
//------------------------------------------------------

function updateInventoryMetrics() {
    const productMetric = document.getElementById("metric-products");

    if (productMetric) {
        productMetric.textContent = inventory.length;
    }

    const lowStockMetric = document.getElementById("metric-low-stock");

    if (lowStockMetric) {
        lowStockMetric.textContent = inventory.filter(product => {
            return product.stock <= (product.lowStock || 5);
        }).length;
    }

    const outStockMetric = document.getElementById("metric-out-stock");

    if (outStockMetric) {
        outStockMetric.textContent = inventory.filter(product => {
            return product.stock <= 0;
        }).length;
    }

    const valueMetric = document.getElementById("metric-inventory-value");

    if (valueMetric) {
        const total = inventory.reduce((sum, product) => {
            return sum + product.cost * product.stock;
        }, 0);

        valueMetric.textContent = formatCurrency(total);
    }
}

//------------------------------------------------------
// RENDER INVENTORY
//------------------------------------------------------

function renderInventory(search = "") {
    const list = document.getElementById("inventory-list");

    if (!list) return;

    const keyword = search.trim().toLowerCase();

    const filtered = inventory.filter(product => {
        return (
            product.name.toLowerCase().includes(keyword) ||
            product.category.toLowerCase().includes(keyword) ||
            product.sku.toLowerCase().includes(keyword)
        );
    });

    updateInventoryMetrics();

    if (!filtered.length) {
        list.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        No products found.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = filtered.map(product => {
        const supplier = getSuppliers().find(
            supplier => supplier.id === product.supplierId
        );

        const status =
            product.stock <= 0
                ? "Out of Stock"
                : product.stock <= (product.lowStock || 5)
                ? "Low Stock"
                : "In Stock";

        return `
            <tr>
                <td>
                    <strong>${product.name}</strong>
                </td>

                <td>${product.sku || "-"}</td>

                <td>${product.category || "-"}</td>

                <td>${supplier ? supplier.name : "-"}</td>

                <td>${formatCurrency(product.cost)}</td>

                <td>${formatCurrency(product.sellingPrice)}</td>

                <td>${product.stock}</td>

                <td>${status}</td>

                <td>
                    <button
                        class="secondary-btn edit-product"
                        data-id="${product.id}">
                        Edit
                    </button>

                    <button
                        class="secondary-btn stock-in"
                        data-id="${product.id}">
                        + Stock
                    </button>

                    <button
                        class="secondary-btn stock-out"
                        data-id="${product.id}">
                        - Stock
                    </button>

                    <button
                        class="danger-btn delete-product"
                        data-id="${product.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll(".edit-product").forEach(button => {
        button.addEventListener("click", () => {
            editProduct(button.dataset.id);
        });
    });

    document.querySelectorAll(".stock-in").forEach(button => {
        button.addEventListener("click", () => {
            const qty = Number(prompt("Quantity to ADD", 1));

            if (!qty || qty <= 0) return;

            adjustStock(button.dataset.id, qty);
        });
    });

    document.querySelectorAll(".stock-out").forEach(button => {
        button.addEventListener("click", () => {
            const qty = Number(prompt("Quantity to REMOVE", 1));

            if (!qty || qty <= 0) return;

            adjustStock(button.dataset.id, -qty);
        });
    });

    document.querySelectorAll(".delete-product").forEach(button => {
        button.addEventListener("click", () => {
            deleteProduct(button.dataset.id);
        });
    });
}

//------------------------------------------------------
// PRODUCT SEARCH
//------------------------------------------------------

function initializeInventorySearch() {
    const input = document.getElementById("inventory-search");

    if (!input) return;

    input.addEventListener("input", () => {
        renderInventory(input.value);
    });

    const clear = document.getElementById("clear-search");

    if (clear) {
        clear.addEventListener("click", () => {
            input.value = "";
            renderInventory();
        });
    }
}

//------------------------------------------------------
// SUPPLIER DROPDOWN FOR PRODUCT FORM
//------------------------------------------------------

function populateProductSupplierDropdown() {
    const select = document.getElementById("product-supplier");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Select Supplier
        </option>
    `;

    getSuppliers().forEach(supplier => {
        const option = document.createElement("option");

        option.value = supplier.id;
        option.textContent = supplier.name;

        select.appendChild(option);
    });
}

//------------------------------------------------------
// EXPORT INVENTORY
//------------------------------------------------------

function exportInventory() {
    downloadJSON("inventory-backup.json", inventory);
}

//------------------------------------------------------
// IMPORT INVENTORY
//------------------------------------------------------

async function importInventory(file) {
    if (!file) return;

    try {
        const imported = await readJSON(file);

        if (!Array.isArray(imported)) {
            alert("Invalid inventory file.");
            return;
        }

        inventory = normalizeInventory(imported);

        persistInventory();

        renderInventory();

        if (typeof populateProductDropdown === "function") {
            populateProductDropdown();
        }

        showFeedback("Inventory imported.");
    } catch (error) {
        console.error(error);
        alert("Invalid inventory file.");
    }
}

//------------------------------------------------------
// INITIALIZE INVENTORY MODULE
//------------------------------------------------------

function initializeInventoryModule() {
    inventory = normalizeInventory(inventory);

    populateProductSupplierDropdown();
    populateCategoryDropdown();
    populateInventoryCategoryFilter();
    renderInventory();

    initializeInventorySearch();

    const form = document.getElementById("inventory-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveProduct();
        });
    }

    const importButton = document.getElementById("inventory-import-btn");

    const importFile = document.getElementById("inventory-import-file");

    if (importButton && importFile) {
        importButton.addEventListener("click", () => {
            importFile.click();
        });

        importFile.addEventListener("change", e => {
            importInventory(e.target.files[0]);
        });
    }

    const exportButton = document.getElementById("inventory-export-btn");

    if (exportButton) {
        exportButton.addEventListener("click", exportInventory);
    }
}

//------------------------------------------------------
// REFRESH INVENTORY
//------------------------------------------------------

function refreshInventory() {
    inventory = normalizeInventory(loadState().inventory || []);

    populateProductSupplierDropdown();

    renderInventory();
}
function populateCategoryDropdown() {
    const select = document.getElementById("product-category");

    if (!select) return;

    if (typeof getCategories !== "function") return;

    const categories = getCategories();

    select.innerHTML = `
        <option value="">Select Category</option>
    `;

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
}
function populateInventoryCategoryFilter() {
    const filter = document.getElementById("category-filter");

    if (!filter) return;

    if (typeof getCategories !== "function") return;

    const categories = getCategories();

    filter.innerHTML = `
        <option value="">All Categories</option>
    `;

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        filter.appendChild(option);
    });

    filter.addEventListener("change", () => {
        renderInventoryByCategory(filter.value);
    });
}

function renderInventoryByCategory(categoryName = "") {
    const list = document.getElementById("inventory-list");

    if (!list) return;

    if (!categoryName) {
        renderInventory();
        return;
    }

    const filtered = inventory.filter(product => {
        return (product.category || "").toLowerCase() === categoryName.toLowerCase();
    });

    if (!filtered.length) {
        list.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        No products found in this category.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const oldInventory = inventory;
    inventory = filtered;
    renderInventory();
    inventory = oldInventory;
}