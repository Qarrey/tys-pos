//======================================================
// TYS POS v3
// PROFIT BY PRODUCT MODULE
//======================================================

//------------------------------------------------------
// CALCULATE PRODUCT PROFITS
//------------------------------------------------------

function calculateProductProfits() {

    const state =
        loadState();


    const sales =
        state.sales || [];


    const products = {};


    sales.forEach(sale => {


        (sale.items || [])
            .forEach(item => {


                const productName =

                    item.name ||
                    "Unknown Product";


                if (
                    !products[
                        productName
                    ]
                ) {

                    products[
                        productName
                    ] = {

                        name:
                            productName,

                        quantity:
                            0,

                        revenue:
                            0,

                        cost:
                            0,

                        profit:
                            0

                    };

                }


                const quantity =

                    Number(
                        item.quantity || 0
                    );


                const price =

                    Number(
                        item.price || 0
                    );


                const costPrice =

                    Number(
                        item.cost || 0
                    );


                const revenue =

                    price *
                    quantity;


                const cost =

                    costPrice *
                    quantity;


                products[
                    productName
                ].quantity +=
                    quantity;


                products[
                    productName
                ].revenue +=
                    revenue;


                products[
                    productName
                ].cost +=
                    cost;


                products[
                    productName
                ].profit +=

                    revenue -
                    cost;


            });


    });


    return Object
        .values(products)

        .sort(

            (a, b) =>

                b.profit -
                a.profit

        );

}

//------------------------------------------------------
// SUMMARY
//------------------------------------------------------

function updateProductProfitSummary(

    products

) {


    const revenue =

        products.reduce(

            (sum, product) =>

                sum +

                Number(
                    product.revenue || 0
                ),

            0

        );


    const cost =

        products.reduce(

            (sum, product) =>

                sum +

                Number(
                    product.cost || 0
                ),

            0

        );


    const profit =

        revenue -
        cost;


    const revenueElement =

        document.getElementById(

            "product-profit-revenue"

        );


    const costElement =

        document.getElementById(

            "product-profit-cost"

        );


    const profitElement =

        document.getElementById(

            "product-profit-total"

        );


    const countElement =

        document.getElementById(

            "product-profit-count"

        );


    if (revenueElement) {

        revenueElement.textContent =

            formatCurrency(
                revenue
            );

    }


    if (costElement) {

        costElement.textContent =

            formatCurrency(
                cost
            );

    }


    if (profitElement) {

        profitElement.textContent =

            formatCurrency(
                profit
            );

    }


    if (countElement) {

        countElement.textContent =

            products.length;

    }

}

//------------------------------------------------------
// RENDER TABLE
//------------------------------------------------------

function renderProductProfits(

    search = ""

) {


    const list =

        document.getElementById(

            "product-profit-list"

        );


    if (!list) return;


    const allProducts =

        calculateProductProfits();


    updateProductProfitSummary(

        allProducts

    );


    const keyword =

        search

            .trim()

            .toLowerCase();


    const products =

        allProducts.filter(

            product =>

                product.name

                    .toLowerCase()

                    .includes(

                        keyword

                    )

        );


    if (
        !products.length
    ) {

        list.innerHTML = `

            <tr>

                <td colspan="6">

                    <div class="empty-state">

                        No product sales found.

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    list.innerHTML =

        products.map(

            product => {


                const margin =

                    product.revenue > 0

                        ?

                        (
                            product.profit /

                            product.revenue

                        ) * 100

                        :

                        0;


                return `

                    <tr>

                        <td>

                            <strong>

                                ${product.name}

                            </strong>

                        </td>


                        <td>

                            ${product.quantity}

                        </td>


                        <td>

                            ${formatCurrency(

                                product.revenue

                            )}

                        </td>


                        <td>

                            ${formatCurrency(

                                product.cost

                            )}

                        </td>


                        <td>

                            <strong>

                                ${formatCurrency(

                                    product.profit

                                )}

                            </strong>

                        </td>


                        <td>

                            ${margin.toFixed(1)}%

                        </td>

                    </tr>

                `;

            }

        ).join("");

}

//------------------------------------------------------
// SEARCH
//------------------------------------------------------

function initializeProductProfitSearch() {

    const search =

        document.getElementById(

            "product-profit-search"

        );


    if (
        search &&
        !search.dataset.ready
    ) {

        search.dataset.ready =
            "true";


        search.addEventListener(

            "input",

            () => {


                renderProductProfits(

                    search.value

                );


            }

        );

    }


    const clear =

        document.getElementById(

            "clear-product-profit-search"

        );


    if (
        clear &&
        !clear.dataset.ready
    ) {

        clear.dataset.ready =
            "true";


        clear.addEventListener(

            "click",

            () => {


                if (search) {

                    search.value =
                        "";

                }


                renderProductProfits();


            }

        );

    }

}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeProductProfitModule() {

    renderProductProfits();

    initializeProductProfitSearch();

}


document.addEventListener(

    "DOMContentLoaded",

    initializeProductProfitModule

);