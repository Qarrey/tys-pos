//======================================================
// TYS POS v3
// STOCKTAKING MODULE
//======================================================

let stocktakeCounts = {};

//------------------------------------------------------
// GET INVENTORY
//------------------------------------------------------

function getStocktakeInventory() {

    const state = loadState();

    return state.inventory || [];

}

//------------------------------------------------------
// RENDER STOCKTAKE
//------------------------------------------------------

function renderStocktake(search = "") {

    const list =
        document.getElementById("stocktake-list");

    if (!list) return;


    const inventory =
        getStocktakeInventory();


    const keyword =
        search.trim().toLowerCase();


    const products =
        inventory.filter(product => {

            return (

                String(product.name || "")
                    .toLowerCase()
                    .includes(keyword)

                ||

                String(product.sku || "")
                    .toLowerCase()
                    .includes(keyword)

                ||

                String(product.category || "")
                    .toLowerCase()
                    .includes(keyword)

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
                Number(product.stock || 0);


            const physicalStock =

                stocktakeCounts[
                    product.id
                ];


            const difference =

                physicalStock === undefined

                    ? 0

                    : physicalStock -
                      systemStock;


            let status =
                "Not Counted";


            if (
                physicalStock !==
                undefined
            ) {

                if (difference < 0) {

                    status =
                        "Shortage";

                }

                else if (
                    difference > 0
                ) {

                    status =
                        "Extra Stock";

                }

                else {

                    status =
                        "Correct";

                }

            }


            return `

                <tr>

                    <td>

                        <strong>

                            ${product.name}

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

//------------------------------------------------------
// PHYSICAL STOCK INPUTS
//------------------------------------------------------

function initializeStockInputs() {

    document
        .querySelectorAll(
            ".physical-stock-input"
        )
        .forEach(input => {


            input.addEventListener(

                "input",

                () => {


                    const id =
                        input.dataset.id;


                    if (
                        input.value === ""
                    ) {

                        delete stocktakeCounts[
                            id
                        ];

                    }

                    else {

                        stocktakeCounts[
                            id
                        ] =

                            Number(
                                input.value
                            );

                    }


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

//------------------------------------------------------
// SUMMARY
//------------------------------------------------------

function updateStocktakeSummary() {

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

            physical -

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


    document
        .getElementById(
            "stocktake-count"
        )
        .textContent =
        counted;


    document
        .getElementById(
            "stocktake-shortages"
        )
        .textContent =
        shortages;


    document
        .getElementById(
            "stocktake-extra"
        )
        .textContent =
        extra;

}

//------------------------------------------------------
// SAVE STOCKTAKE
//------------------------------------------------------

function saveStocktake() {

    const state =
        loadState();


    const inventory =
        state.inventory || [];


    const countedIds =

        Object.keys(
            stocktakeCounts
        );


    if (
        !countedIds.length
    ) {

        alert(

            "Enter at least one physical stock quantity."

        );

        return;

    }


    if (

        !confirm(

            "Save stocktake and update inventory quantities?"

        )

    ) {

        return;

    }


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


        const oldStock =

            Number(
                product.stock || 0
            );


        const difference =

            physical -
            oldStock;


        if (
            difference !== 0
        ) {


            recordStockMovement({

                productId:
                    product.id,

                productName:
                    product.name,

                type:
                    "Stocktake",

                quantity:
                    difference,

                notes:

                    `Physical count changed stock from ${oldStock} to ${physical}`

            });

        }


        product.stock =
            physical;


    });


    saveState({

        inventory,

        sales:
            state.sales || []

    });


    stocktakeCounts = {};


    renderStocktake();

    updateStocktakeSummary();


    alert(

        "Stocktake saved and inventory updated."

    );

}

//------------------------------------------------------
// SEARCH
//------------------------------------------------------

function initializeStocktakeSearch() {

    const search =

        document
            .getElementById(
                "stocktake-search"
            );


    if (search) {

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

        document
            .getElementById(
                "clear-stocktake-search"
            );


    if (clear) {

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

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeStocktakeModule() {

    renderStocktake();

    updateStocktakeSummary();

    initializeStocktakeSearch();


    const saveButton =

        document
            .getElementById(
                "save-stocktake-btn"
            );


    if (saveButton) {

        saveButton.addEventListener(

            "click",

            saveStocktake

        );

    }

}


document.addEventListener(

    "DOMContentLoaded",

    initializeStocktakeModule

);