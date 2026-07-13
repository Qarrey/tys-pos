//======================================================
// TYS POS v3
// STOCKTAKING MODULE
// LOCAL + SUPABASE
//======================================================

let stocktakeCounts = {};
let stocktakeSaving = false;


//======================================================
// INVENTORY
//======================================================

function getStocktakeInventory() {
    try {
        const state =
            typeof loadState === "function"
                ? loadState()
                : {};

        return Array.isArray(state.inventory)
            ? state.inventory
            : [];

    } catch (error) {
        console.error(
            "Could not load stocktake inventory:",
            error
        );

        return [];
    }
}


//======================================================
// CURRENT USER
//======================================================

async function getStocktakeCurrentUser() {
    try {
        if (
            typeof loadCurrentPOSUser ===
            "function"
        ) {
            await loadCurrentPOSUser();
        }
    } catch (error) {
        console.warn(
            "Could not load the current POS user:",
            error
        );
    }

    return {
        id:
            window.currentPOSUser?.id ||
            window.currentPOSUser?.userId ||
            "",

        name:
            window.currentPOSUser?.fullName ||
            window.currentPOSUser?.name ||
            window.currentPOSUser?.email ||
            "Admin"
    };
}


//======================================================
// RENDER STOCKTAKE
//======================================================

function renderStocktake(search = "") {
    const list =
        document.getElementById(
            "stocktake-list"
        );

    if (!list) return;

    const inventory =
        getStocktakeInventory();

    const keyword =
        String(search || "")
            .trim()
            .toLowerCase();

    const products =
        inventory.filter(product => {
            const name =
                String(
                    product.name || ""
                ).toLowerCase();

            const sku =
                String(
                    product.sku || ""
                ).toLowerCase();

            const category =
                String(
                    product.category || ""
                ).toLowerCase();

            return (
                name.includes(keyword) ||
                sku.includes(keyword) ||
                category.includes(keyword)
            );
        });

    if (!products.length) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        No products found.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    list.innerHTML =
        products.map(product => {
            const systemStock =
                Number(
                    product.stock || 0
                );

            const physicalStock =
                stocktakeCounts[
                    product.id
                ];

            const difference =
                physicalStock === undefined
                    ? 0
                    : Number(physicalStock) -
                      systemStock;

            let status =
                "Not Counted";

            if (
                physicalStock !==
                undefined
            ) {
                if (difference < 0) {
                    status = "Shortage";
                } else if (difference > 0) {
                    status = "Extra Stock";
                } else {
                    status = "Correct";
                }
            }

            return `
                <tr>

                    <td>
                        <strong>
                            ${product.name || "-"}
                        </strong>
                    </td>

                    <td>
                        ${product.sku || "-"}
                    </td>

                    <td>
                        ${systemStock}
                    </td>

                    <td>
                        <input
                            type="number"
                            class="physical-stock-input"
                            data-id="${product.id}"
                            min="0"
                            step="0.01"
                            value="${
                                physicalStock ??
                                ""
                            }"
                            placeholder="Count">
                    </td>

                    <td>
                        ${difference}
                    </td>

                    <td>
                        ${status}
                    </td>

                </tr>
            `;
        }).join("");

    initializeStockInputs();
}


//======================================================
// PHYSICAL STOCK INPUTS
//======================================================

function initializeStockInputs() {
    document
        .querySelectorAll(
            ".physical-stock-input"
        )
        .forEach(input => {
            if (
                input.dataset.ready ===
                "true"
            ) {
                return;
            }

            input.dataset.ready =
                "true";

            input.addEventListener(
                "input",
                () => {
                    const productId =
                        input.dataset.id;

                    if (
                        input.value === ""
                    ) {
                        delete stocktakeCounts[
                            productId
                        ];

                        updateStocktakeSummary();

                        return;
                    }

                    const value =
                        Number(
                            input.value
                        );

                    if (
                        !Number.isFinite(value) ||
                        value < 0
                    ) {
                        return;
                    }

                    stocktakeCounts[
                        productId
                    ] = value;

                    updateStocktakeSummary();
                }
            );

            input.addEventListener(
                "change",
                () => {
                    const search =
                        document
                            .getElementById(
                                "stocktake-search"
                            )
                            ?.value || "";

                    renderStocktake(
                        search
                    );
                }
            );
        });
}


//======================================================
// SUMMARY
//======================================================

function calculateStocktakeSummary() {
    const inventory =
        getStocktakeInventory();

    let counted = 0;
    let shortages = 0;
    let extra = 0;

    inventory.forEach(product => {
        const physical =
            stocktakeCounts[
                product.id
            ];

        if (
            physical === undefined
        ) {
            return;
        }

        counted++;

        const difference =
            Number(physical) -
            Number(
                product.stock || 0
            );

        if (difference < 0) {
            shortages++;
        }

        if (difference > 0) {
            extra++;
        }
    });

    return {
        counted,
        shortages,
        extra
    };
}


function updateStocktakeSummary() {
    const summary =
        calculateStocktakeSummary();

    const countElement =
        document.getElementById(
            "stocktake-count"
        );

    const shortageElement =
        document.getElementById(
            "stocktake-shortages"
        );

    const extraElement =
        document.getElementById(
            "stocktake-extra"
        );

    if (countElement) {
        countElement.textContent =
            summary.counted;
    }

    if (shortageElement) {
        shortageElement.textContent =
            summary.shortages;
    }

    if (extraElement) {
        extraElement.textContent =
            summary.extra;
    }
}


//======================================================
// BUILD STOCKTAKE RECORD
//======================================================

async function buildStocktakeRecord() {
    const inventory =
        getStocktakeInventory();

    const user =
        await getStocktakeCurrentUser();

    const items = [];

    inventory.forEach(product => {
        const physicalStock =
            stocktakeCounts[
                product.id
            ];

        if (
            physicalStock === undefined
        ) {
            return;
        }

        const systemStock =
            Number(
                product.stock || 0
            );

        const physical =
            Number(
                physicalStock
            );

        items.push({
            productId:
                product.id,

            productName:
                product.name ||
                "Unknown Product",

            systemStock,

            physicalStock:
                physical,

            difference:
                physical -
                systemStock
        });
    });

    const summary =
        calculateStocktakeSummary();

    return {
        countedById:
            user.id || null,

        countedBy:
            user.name || "Admin",

        countedItems:
            summary.counted,

        shortages:
            summary.shortages,

        extraStock:
            summary.extra,

        items
    };
}


//======================================================
// SAVE LOCAL STOCKTAKE
//======================================================

function applyStocktakeLocally(
    stocktake
) {
    const state =
        typeof loadState === "function"
            ? loadState()
            : {};

    const inventory =
        Array.isArray(state.inventory)
            ? state.inventory
            : [];

    stocktake.items.forEach(item => {
        const product =
            inventory.find(product => {
                return (
                    String(product.id) ===
                    String(item.productId)
                );
            });

        if (!product) return;

        if (
            item.difference !== 0 &&
            typeof recordStockMovement ===
            "function"
        ) {
            recordStockMovement({
                productId:
                    product.id,

                productName:
                    product.name,

                type:
                    "Stocktake",

                quantity:
                    item.difference,

                notes:
                    `Physical count changed stock from ${item.systemStock} to ${item.physicalStock}`
            });
        }

        product.stock =
            item.physicalStock;
    });

    if (
        typeof saveState ===
        "function"
    ) {
       saveState({
    ...state,
    inventory,
    sales: state.sales || []
});
    }

    window.inventory =
        inventory;
}


//======================================================
// SAVE STOCKTAKE
//======================================================

async function saveStocktake() {
    if (stocktakeSaving) return;

    if (!Object.keys(stocktakeCounts).length) {
        alert("Enter at least one physical stock quantity.");
        return;
    }

    if (!confirm("Save stocktake and update inventory quantities?")) {
        return;
    }

    const saveButton = document.getElementById("save-stocktake-btn");
    stocktakeSaving = true;

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }

    try {
        const stocktake = await buildStocktakeRecord();

        if (!stocktake.items.length) {
            throw new Error("No valid counted products were found.");
        }

        if (typeof saveStocktakeToSupabase !== "function") {
            throw new Error("The online Stocktake module did not load.");
        }

        console.log("Stocktake being saved:", stocktake);

        const cloudResult = await saveStocktakeToSupabase(stocktake);

        if (!cloudResult) {
            throw window.lastStocktakeError || new Error(
                "Supabase did not accept the stocktake. Check the Console for details."
            );
        }

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
        alert(`Stocktake was not saved:\n\n${error.message || "Unknown error"}`);

    } finally {
        stocktakeSaving = false;

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Save Stocktake";
        }
    }
}


//======================================================
// SEARCH
//======================================================

function initializeStocktakeSearch() {
    const search =
        document.getElementById(
            "stocktake-search"
        );

    if (
        search &&
        search.dataset.ready !== "true"
    ) {
        search.dataset.ready =
            "true";

        search.addEventListener(
            "input",
            () => {
                renderStocktake(
                    search.value
                );
            }
        );
    }

    const clear =
        document.getElementById(
            "clear-stocktake-search"
        );

    if (
        clear &&
        clear.dataset.ready !== "true"
    ) {
        clear.dataset.ready =
            "true";

        clear.addEventListener(
            "click",
            () => {
                if (search) {
                    search.value = "";
                }

                renderStocktake();
            }
        );
    }
}


//======================================================
// INITIALIZE
//======================================================

function initializeStocktakeModule() {
    renderStocktake();

    updateStocktakeSummary();

    initializeStocktakeSearch();

    const saveButton =
        document.getElementById(
            "save-stocktake-btn"
        );

    if (
        saveButton &&
        saveButton.dataset.ready !==
        "true"
    ) {
        saveButton.dataset.ready =
            "true";

        saveButton.addEventListener(
            "click",
            saveStocktake
        );
    }
}


//======================================================
// AUTO START
//======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeStocktakeModule
);