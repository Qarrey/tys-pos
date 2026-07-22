//======================================================
// TYS POS - PRODUCT VARIATIONS
//======================================================

const VARIATION_STORAGE_KEY = "tys-pos-product-variations";
window.productVariations = window.productVariations || [];
let productVariationsChannel = null;

function escapeVariationHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeVariation(row = {}) {
    return {
        id: row.id || "",
        productId: row.productId || row.product_id || "",
        name: String(row.name || "").trim(),
        sellingPrice: Number(row.sellingPrice ?? row.selling_price ?? 0),
        stockDeduction: Number(row.stockDeduction ?? row.stock_deduction ?? 1),
        barcode: String(row.barcode || "").trim(),
        active: row.active !== false,
        createdAt: row.createdAt || row.created_at || null
    };
}

function getStoredProductVariations() {
    try {
        return (JSON.parse(localStorage.getItem(VARIATION_STORAGE_KEY)) || [])
            .map(normalizeVariation);
    } catch (error) {
        console.error("Could not read saved variations:", error);
        return [];
    }
}

function saveStoredProductVariations(variations) {
    window.productVariations = (variations || []).map(normalizeVariation);
    localStorage.setItem(
        VARIATION_STORAGE_KEY,
        JSON.stringify(window.productVariations)
    );
}

function getProductVariations(productId, activeOnly = true) {
    return (window.productVariations || []).filter(variation => {
        const sameProduct = String(variation.productId) === String(productId);
        return sameProduct && (!activeOnly || variation.active !== false);
    });
}

// Return active variations grouped by product ID for the POS.
// The price alias keeps compatibility with the existing sales module.
function getProductVariants() {
    return (window.productVariations || []).reduce((groups, variation) => {
        if (variation.active === false || !variation.productId) return groups;

        const productId = String(variation.productId);
        if (!groups[productId]) groups[productId] = [];

        groups[productId].push({
            ...variation,
            price: Number(variation.sellingPrice || 0)
        });

        return groups;
    }, {});
}

function getVariationById(variationId) {
    return (window.productVariations || []).find(
        variation => String(variation.id) === String(variationId)
    ) || null;
}

function getVariationByBarcode(barcode) {
    const wanted = String(barcode || "").trim().toLowerCase();
    if (!wanted) return null;

    return (window.productVariations || []).find(variation => (
        variation.active !== false &&
        String(variation.barcode || "").trim().toLowerCase() === wanted
    )) || null;
}

async function loadProductVariations() {
    if (!window.supabaseClient) {
        window.productVariations = getStoredProductVariations();
        return window.productVariations;
    }

    const { data, error } = await supabaseClient
        .from("product_variations")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Could not load product variations:", error);
        window.productVariations = getStoredProductVariations();
        return window.productVariations;
    }

    saveStoredProductVariations(data || []);
    return window.productVariations;
}

async function upsertProductVariation(variation) {
    const payload = {
        product_id: variation.productId,
        name: variation.name.trim(),
        selling_price: Number(variation.sellingPrice),
        stock_deduction: Number(variation.stockDeduction),
        barcode: variation.barcode?.trim() || null,
        active: variation.active !== false,
        updated_at: new Date().toISOString()
    };

    let query = supabaseClient.from("product_variations");
    query = variation.id
        ? query.update(payload).eq("id", variation.id)
        : query.insert(payload);

    const { data, error } = await query.select().single();
    if (error) throw error;

    await loadProductVariations();
    return normalizeVariation(data);
}

async function deleteProductVariation(variationId) {
    const { error } = await supabaseClient
        .from("product_variations")
        .delete()
        .eq("id", variationId);

    if (error) throw error;
    await loadProductVariations();
}

function getVariationProductName(productId) {
    const product = (window.inventory || []).find(
        item => String(item.id) === String(productId)
    );
    return product?.name || "Unknown Product";
}

function populateVariationProductInputs() {
    const products = [...(window.inventory || [])]
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    ["variation-product", "variation-product-filter"].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentValue = select.value;
        const firstLabel = id === "variation-product"
            ? "Select Product"
            : "All Products";

        select.innerHTML = `<option value="">${firstLabel}</option>` +
            products.map(product => `
                <option value="${escapeVariationHtml(product.id)}">
                    ${escapeVariationHtml(product.name)}
                </option>
            `).join("");

        select.value = currentValue;
    });
}

function resetVariationForm() {
    document.getElementById("variation-form")?.reset();
    const idInput = document.getElementById("variation-id");
    if (idInput) idInput.value = "";

    const deduction = document.getElementById("variation-deduction");
    if (deduction) deduction.value = "1";

    const active = document.getElementById("variation-active");
    if (active) active.value = "true";

    const title = document.getElementById("variation-form-title");
    if (title) title.textContent = "Add Variation";

    const button = document.getElementById("variation-save-btn");
    if (button) button.textContent = "Save Variation";

    const cancel = document.getElementById("variation-cancel-btn");
    if (cancel) cancel.hidden = true;
}

function editVariation(variationId) {
    const variation = getVariationById(variationId);
    if (!variation) return;

    document.getElementById("variation-id").value = variation.id;
    document.getElementById("variation-product").value = variation.productId;
    document.getElementById("variation-name").value = variation.name;
    document.getElementById("variation-price").value = variation.sellingPrice;
    document.getElementById("variation-deduction").value = variation.stockDeduction;
    document.getElementById("variation-barcode").value = variation.barcode;
    document.getElementById("variation-active").value = String(variation.active);
    document.getElementById("variation-form-title").textContent = "Edit Variation";
    document.getElementById("variation-save-btn").textContent = "Update Variation";
    document.getElementById("variation-cancel-btn").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderVariationTable() {
    const body = document.getElementById("variation-table-body");
    if (!body) return;

    const search = String(document.getElementById("variation-search")?.value || "")
        .trim().toLowerCase();
    const productFilter = document.getElementById("variation-product-filter")?.value || "";

    const rows = (window.productVariations || [])
        .filter(variation => {
            const productName = getVariationProductName(variation.productId);
            const matchesSearch = !search ||
                productName.toLowerCase().includes(search) ||
                variation.name.toLowerCase().includes(search) ||
                variation.barcode.toLowerCase().includes(search);
            const matchesProduct = !productFilter ||
                String(variation.productId) === String(productFilter);
            return matchesSearch && matchesProduct;
        })
        .sort((a, b) => {
            const productCompare = getVariationProductName(a.productId)
                .localeCompare(getVariationProductName(b.productId));
            return productCompare || a.name.localeCompare(b.name);
        });

    if (!rows.length) {
        body.innerHTML = `<tr><td colspan="7"><div class="empty-state">No variations found.</div></td></tr>`;
        return;
    }

    body.innerHTML = rows.map(variation => `
        <tr>
            <td>${escapeVariationHtml(getVariationProductName(variation.productId))}</td>
            <td>${escapeVariationHtml(variation.name)}</td>
            <td>${typeof formatCurrency === "function" ? formatCurrency(variation.sellingPrice) : `KSh ${variation.sellingPrice.toFixed(2)}`}</td>
            <td>${variation.stockDeduction}</td>
            <td>${escapeVariationHtml(variation.barcode || "-")}</td>
            <td>${variation.active ? "Active" : "Inactive"}</td>
            <td>
                <button class="secondary-btn variation-edit-btn" data-id="${variation.id}" type="button">Edit</button>
                <button class="danger-btn variation-delete-btn" data-id="${variation.id}" type="button">Delete</button>
            </td>
        </tr>
    `).join("");

    body.querySelectorAll(".variation-edit-btn").forEach(button => {
        button.addEventListener("click", () => editVariation(button.dataset.id));
    });

    body.querySelectorAll(".variation-delete-btn").forEach(button => {
        button.addEventListener("click", async () => {
            const variation = getVariationById(button.dataset.id);
            if (!variation || !confirm(`Delete ${variation.name}?`)) return;

            try {
                await deleteProductVariation(variation.id);
                renderVariationTable();
            } catch (error) {
                console.error(error);
                alert(error.message || "Could not delete variation.");
            }
        });
    });
}

function subscribeToProductVariations() {
    if (!window.supabaseClient) return;
    if (productVariationsChannel) supabaseClient.removeChannel(productVariationsChannel);

    productVariationsChannel = supabaseClient
        .channel("tys-product-variations-realtime")
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "product_variations"
        }, async () => {
            await loadProductVariations();
            renderVariationTable();
            if (typeof renderProducts === "function") renderProducts(
                document.getElementById("search-input")?.value || ""
            );
        })
        .subscribe();
}

async function initializeProductVariations() {
    if (typeof syncCloudProductsToPOS === "function") {
        try {
            await syncCloudProductsToPOS();
        } catch (error) {
            console.error("Could not refresh products before loading variations:", error);
        }
    }

    await loadProductVariations();
    populateVariationProductInputs();
    renderVariationTable();
    subscribeToProductVariations();

    const form = document.getElementById("variation-form");
    form?.addEventListener("submit", async event => {
        event.preventDefault();

        const variation = {
            id: document.getElementById("variation-id").value,
            productId: document.getElementById("variation-product").value,
            name: document.getElementById("variation-name").value.trim(),
            sellingPrice: Number(document.getElementById("variation-price").value),
            stockDeduction: Number(document.getElementById("variation-deduction").value),
            barcode: document.getElementById("variation-barcode").value.trim(),
            active: document.getElementById("variation-active").value === "true"
        };

        if (!variation.productId || !variation.name) {
            alert("Choose a product and enter a variation name.");
            return;
        }
        if (!Number.isFinite(variation.sellingPrice) || variation.sellingPrice < 0) {
            alert("Enter a valid selling price.");
            return;
        }
        if (!Number.isFinite(variation.stockDeduction) || variation.stockDeduction <= 0) {
            alert("Stock deduction must be greater than zero.");
            return;
        }

        try {
            await upsertProductVariation(variation);
            resetVariationForm();
            renderVariationTable();
        } catch (error) {
            console.error(error);
            alert(error.message || "Could not save variation.");
        }
    });

    document.getElementById("variation-cancel-btn")
        ?.addEventListener("click", resetVariationForm);
    document.getElementById("variation-search")
        ?.addEventListener("input", renderVariationTable);
    document.getElementById("variation-product-filter")
        ?.addEventListener("change", renderVariationTable);
    document.getElementById("variation-clear-filter")
        ?.addEventListener("click", () => {
            const search = document.getElementById("variation-search");
            const product = document.getElementById("variation-product-filter");
            if (search) search.value = "";
            if (product) product.value = "";
            renderVariationTable();
        });
}

window.getProductVariations = getProductVariations;
window.getVariationById = getVariationById;
window.getVariationByBarcode = getVariationByBarcode;
window.loadProductVariations = loadProductVariations;

document.addEventListener("DOMContentLoaded", initializeProductVariations, { once: true });
