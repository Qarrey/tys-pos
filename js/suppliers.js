//======================================================
// TYS POS v3
// SUPPLIERS MODULE
//======================================================

//------------------------------------------------------
// GLOBAL
//------------------------------------------------------
//------------------------------------------------------
// SAVE SUPPLIER
//------------------------------------------------------

function saveSupplier() {
    const nameInput = document.getElementById("supplier-name");
    const contactInput = document.getElementById("supplier-contact");
    const phoneInput = document.getElementById("supplier-phone");
    const emailInput = document.getElementById("supplier-email");
    const addressInput = document.getElementById("supplier-address");

    const name = nameInput ? nameInput.value.trim() : "";
    const contact = contactInput ? contactInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const address = addressInput ? addressInput.value.trim() : "";

    if (!name) {
        alert("Supplier name is required.");
        return;
    }

    const supplierList = getSuppliers();

    const supplier = {
    id: generateId("SUP-"),
    name,
    contact,
    phone,
    email,
    address,
    createdAt: new Date().toISOString()
};

supplierList.unshift(supplier);

saveSuppliers(supplierList);


// SAVE TO SUPABASE

if (
    typeof saveSupplierToSupabase === "function"
) {
    saveSupplierToSupabase(supplier)
        .then(result => {
            if (result) {
                console.log(
                    "Supplier saved locally and online."
                );
            }
        })
        .catch(error => {
            console.error(
                "Cloud supplier save failed:",
                error
            );
        });
}
    renderSuppliers();

    if (typeof populateSupplierDropdown === "function") {
        populateSupplierDropdown();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

    document.getElementById("supplier-form").reset();

    alert("Supplier saved.");
}
//------------------------------------------------------
// RENDER SUPPLIERS
//------------------------------------------------------

function renderSuppliers(search = "") {

    const container = document.getElementById("supplier-list");

    if (!container) return;

    suppliers = getSuppliers();

    const keyword = search.trim().toLowerCase();

    const filtered = suppliers.filter(supplier => {

        return (
            supplier.name.toLowerCase().includes(keyword) ||
            (supplier.contact || "").toLowerCase().includes(keyword) ||
            (supplier.phone || "").toLowerCase().includes(keyword) ||
            (supplier.email || "").toLowerCase().includes(keyword)
        );

    });

    if (!filtered.length) {

        container.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No suppliers found.
                    </div>
                </td>
            </tr>
        `;

        return;

    }

    container.innerHTML = filtered.map(supplier => `

        <tr>

            <td>
                <strong>${supplier.name}</strong>
            </td>

            <td>${supplier.contact || "-"}</td>

            <td>${supplier.phone || "-"}</td>

            <td>${supplier.email || "-"}</td>

            <td>${supplier.address || "-"}</td>

            <td>
                <button
                    class="secondary-btn edit-supplier"
                    data-id="${supplier.id}">
                    Edit
                </button>

                <button
                    class="danger-btn delete-supplier"
                    data-id="${supplier.id}">
                    Delete
                </button>
            </td>

        </tr>

    `).join("");

    document.querySelectorAll(".edit-supplier").forEach(button => {

        button.addEventListener("click", () => {

            editSupplier(button.dataset.id);

        });

    });

    document.querySelectorAll(".delete-supplier").forEach(button => {

        button.addEventListener("click", () => {

            deleteSupplier(button.dataset.id);

        });

    });

}
//------------------------------------------------------
// EDIT SUPPLIER
//------------------------------------------------------

function editSupplier(supplierId) {

    suppliers = getSuppliers();

    const supplier = suppliers.find(s => s.id === supplierId);

    if (!supplier) return;

    document.getElementById("supplier-name").value = supplier.name || "";
    document.getElementById("supplier-contact").value = supplier.contact || "";
    document.getElementById("supplier-phone").value = supplier.phone || "";
    document.getElementById("supplier-email").value = supplier.email || "";
    document.getElementById("supplier-address").value = supplier.address || "";

    suppliers = suppliers.filter(s => s.id !== supplierId);

    saveSuppliers(suppliers);

    renderSuppliers();

    if (typeof populateSupplierDropdown === "function") {
        populateSupplierDropdown();
    }

}

//------------------------------------------------------
// DELETE SUPPLIER
//------------------------------------------------------

function deleteSupplier(supplierId) {

    suppliers = getSuppliers();

    const supplier = suppliers.find(s => s.id === supplierId);

    if (!supplier) return;

    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;

    suppliers = suppliers.filter(s => s.id !== supplierId);

    saveSuppliers(suppliers);


saveSuppliers(suppliers);


// DELETE FROM SUPABASE

if (
    typeof deleteSupplierFromSupabase === "function"
) {
    deleteSupplierFromSupabase(supplierId)
        .catch(error => {
            console.error(
                "Cloud supplier deletion failed:",
                error
            );
        });
}


renderSuppliers();

    if (typeof populateSupplierDropdown === "function") {
        populateSupplierDropdown();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }

}
//------------------------------------------------------
// SUPPLIER SEARCH
//------------------------------------------------------

function initializeSupplierSearch() {

    const search = document.getElementById("supplier-search");

    if (!search) return;

    search.addEventListener("input", () => {

        renderSuppliers(search.value);

    });

    const clear = document.getElementById("clear-supplier-search");

    if (clear) {

        clear.addEventListener("click", () => {

            search.value = "";

            renderSuppliers();

        });

    }

}

//------------------------------------------------------
// INITIALIZE SUPPLIERS MODULE
//------------------------------------------------------

function initializeSuppliersModule() {

    suppliers = getSuppliers();

    renderSuppliers();

    initializeSupplierSearch();

    const form = document.getElementById("supplier-form");

    if (form) {

        form.addEventListener("submit", e => {

            e.preventDefault();

            saveSupplier();

        });

    }

    if (typeof populateSupplierDropdown === "function") {

        populateSupplierDropdown();

    }

    if (typeof updateDashboardMetrics === "function") {

        updateDashboardMetrics();

    }

}

//------------------------------------------------------
// REFRESH SUPPLIERS
//------------------------------------------------------

function refreshSuppliers() {

    suppliers = getSuppliers();

    renderSuppliers();

    if (typeof populateSupplierDropdown === "function") {

        populateSupplierDropdown();

    }

}

//------------------------------------------------------
// AUTO START
//------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

    if (document.getElementById("supplier-form")) {

        initializeSuppliersModule();

    }

});
