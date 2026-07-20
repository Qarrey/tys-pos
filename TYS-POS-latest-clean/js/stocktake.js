//======================================================
// TYS POS v3
// STOCKTAKING MODULE
// LOCAL + SUPABASE
//======================================================

let stocktakeCounts = {};
let stocktakeSaving = false;

function getStocktakeInventory() {
    try {
        const state = typeof loadState === "function" ? loadState() : {};
        return Array.isArray(state.inventory) ? state.inventory : [];
    } catch (error) {
        console.error("Could not load stocktake inventory:", error);
        return [];
    }
}

async function getStocktakeCurrentUser() {
    if (typeof loadCurrentPOSUser === "function") {
        await loadCurrentPOSUser();
    }

    return {
        id: window.currentPOSUser?.id || "",
        name:
            window.currentPOSUser?.fullName ||
            window.currentPOSUser?.email ||
            "Admin"
    };
}

function renderStocktake(search = "") {
    const list = document.getElementById("stocktake-list");
    if (!list) return;

    const keyword = String(search || "").trim().toLowerCase();
    const products = getStocktakeInventory().filter(product => {
        return (
            String(product.name || "").toLowerCase().includes(keyword) ||
            String(product.sku || "").toLowerCase().includes(keyword) ||
            String(product.category || "").toLowerCase().includes(keyword)
        );
    });

    if (!products.length) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">No products found.</div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = products.map(product => {
        const systemStock = Number(product.stock || 0);
        const physicalStock = stocktakeCounts[product.id];
        const counted = physicalStock !== undefined;
        const difference = counted ? Number(physicalStock) - systemStock : 0;

        let status = "Not Counted";
        if (counted) {
            status = difference < 0 ? "Shortage" : difference > 0 ? "Extra Stock" : "Correct";
        }

        return `
            <tr>
                <td><strong>${product.name || "-"}</strong></td>
                <td>${product.sku || "-"}</td>
                <td>${systemStock}</td>
                <td>
                    <input
                        type="number"
                        class="physical-stock-input"
                        data-id="${product.id}"
                        min="0"
                        step="0.01"
                        value="${counted ? physicalStock : ""}"
                        placeholder="Count">
                </td>
                <td>${difference}</td>
                <td>${status}</td>
            </tr>
        `;
    }).join("");

    initializeStockInputs();
}

function initializeStockInputs() {
    document.querySelectorAll(".physical-stock-input").forEach(input => {
        if (input.dataset.ready === "true") return;
        input.dataset.ready = "true";

        input.addEventListener("input", () => {
            const productId = input.dataset.id;

            if (input.value === "") {
                delete stocktakeCounts[productId];
            } else {
                const value = Number(input.value);
                if (Number.isFinite(value) && value >= 0) {
                    stocktakeCounts[productId] = value;
                }
            }

            updateStocktakeSummary();
        });

        input.addEventListener("change", () => {
            renderStocktake(document.getElementById("stocktake-search")?.value || "");
        });
    });
}

function calculateStocktakeSummary() {
    let counted = 0;
    let shortages = 0;
    let extra = 0;

    getStocktakeInventory().forEach(product => {
        const physical = stocktakeCounts[product.id];
        if (physical === undefined) return;

        counted += 1;
        const difference = Number(physical) - Number(product.stock || 0);
        if (difference < 0) shortages += 1;
        if (difference > 0) extra += 1;
    });

    return { counted, shortages, extra };
}

function updateStocktakeSummary() {
    const summary = calculateStocktakeSummary();

    const countElement = document.getElementById("stocktake-count");
    const shortageElement = document.getElementById("stocktake-shortages");
    const extraElement = document.getElementById("stocktake-extra");

    if (countElement) countElement.textContent = summary.counted;
    if (shortageElement) shortageElement.textContent = summary.shortages;
    if (extraElement) extraElement.textContent = summary.extra;
}

async function buildStocktakeRecord() {
    const user = await getStocktakeCurrentUser();
    const items = [];

    getStocktakeInventory().forEach(product => {
        const physicalStock = stocktakeCounts[product.id];
        if (physicalStock === undefined) return;

        const systemStock = Number(product.stock || 0);
        const physical = Number(physicalStock);

        items.push({
            productId: product.id,
            productName: product.name || "Unknown Product",
            systemStock,
            physicalStock: physical,
            difference: physical - systemStock
        });
    });

    const summary = calculateStocktakeSummary();

    return {
        countedById: user.id || null,
        countedBy: user.name || "Admin",
        countedItems: summary.counted,
        shortages: summary.shortages,
        extraStock: summary.extra,
        items
    };
}

function applyStocktakeLocally(stocktake) {
    const state = typeof loadState === "function" ? loadState() : {};
    const localInventory = Array.isArray(state.inventory) ? state.inventory : [];

    stocktake.items.forEach(item => {
        const product = localInventory.find(entry => String(entry.id) === String(item.productId));
        if (product) product.stock = item.physicalStock;
    });

    if (typeof saveState === "function") {
        saveState({
            ...state,
            inventory: localInventory,
            sales: state.sales || []
        });
    }

    window.inventory = localInventory;
}

async function saveStocktake() {
    if (stocktakeSaving) return;

    if (!Object.keys(stocktakeCounts).length) {
        alert("Enter at least one physical stock quantity.");
        return;
    }

    if (!confirm("Save stocktake and replace the counted product quantities?")) return;

    const saveButton = document.getElementById("save-stocktake-btn");
    stocktakeSaving = true;

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving…";
    }

    try {
        const stocktake = await buildStocktakeRecord();

        if (!stocktake.items.length) {
            alert("No valid counted products were found.");
            return;
        }

        if (typeof saveStocktakeToSupabase !== "function") {
            throw new Error("The cloud Stocktake module did not load.");
        }

        const cloudResult = await saveStocktakeToSupabase(stocktake);
        if (!cloudResult) return;

        applyStocktakeLocally(stocktake);

        if (typeof syncCloudProductsToPOS === "function") {
            await syncCloudProductsToPOS();
        }

        stocktakeCounts = {};
        renderStocktake();
        updateStocktakeSummary();
        alert("Stocktake saved locally and online.");
    } catch (error) {
        console.error("Stocktake save failed:", error);
        if (typeof setStocktakeCloudStatus === "function") {
            setStocktakeCloudStatus(error.message || "Stocktake could not be saved.", "error");
        }
        alert(error.message || "Stocktake could not be saved.");
    } finally {
        stocktakeSaving = false;
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Stocktake";
        }
    }
}

function initializeStocktakeSearch() {
    const search = document.getElementById("stocktake-search");
    const clear = document.getElementById("clear-stocktake-search");

    if (search && search.dataset.ready !== "true") {
        search.dataset.ready = "true";
        search.addEventListener("input", () => renderStocktake(search.value));
    }

    if (clear && clear.dataset.ready !== "true") {
        clear.dataset.ready = "true";
        clear.addEventListener("click", () => {
            if (search) search.value = "";
            renderStocktake();
        });
    }
}

function initializeStocktakeModule() {
    renderStocktake();
    updateStocktakeSummary();
    initializeStocktakeSearch();

    const saveButton = document.getElementById("save-stocktake-btn");
    if (saveButton && saveButton.dataset.ready !== "true") {
        saveButton.dataset.ready = "true";
        saveButton.addEventListener("click", saveStocktake);
    }
}

document.addEventListener("DOMContentLoaded", initializeStocktakeModule, { once: true });
