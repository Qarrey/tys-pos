//======================================================
// TYS POS v3
// SALES MODULE
//======================================================

let cart = [];


//======================================================
// CART HELPERS
//======================================================

function getCartItem(cartId) {
    return cart.find(
        item => String(item.id) === String(cartId)
    );
}


function getCartTotal() {
    return cart.reduce((sum, item) => {
        return (
            sum +
            Number(item.price || 0) *
            Number(item.quantity || 0)
        );
    }, 0);
}


function getCartCost() {
    return cart.reduce((sum, item) => {
        return (
            sum +
            Number(item.cost || 0) *
            Number(item.quantity || 0)
        );
    }, 0);
}


function getDiscountAmount() {
    const input =
        document.getElementById(
            "discount-input"
        );

    return input
        ? Number(input.value || 0)
        : 0;
}


function getFinalTotal() {
    const total =
        getCartTotal() -
        getDiscountAmount();

    return total < 0
        ? 0
        : total;
}


//======================================================
// ADD TO CART
//======================================================

function addToCart(productId, variantId = "") {
    const product =
        getProductById(productId);

    if (!product) {
        alert("Product not found.");
        return;
    }

    if (
        Number(product.stock || 0) <= 0
    ) {
        alert("Out of stock.");
        return;
    }

    const variant = variantId && typeof getVariationById === "function"
        ? getVariationById(variantId)
        : null;
    const deduction = variant ? Number(variant.stockDeduction || 1) : 1;
    const cartId = variant ? `${product.id}::${variant.id}` : product.id;
    const existing = getCartItem(cartId);

    if (existing) {
        if (
            Number(existing.quantity) * deduction >=
            Number(product.stock)
        ) {
            alert("Not enough stock.");
            return;
        }

        existing.quantity =
            Number(existing.quantity) + 1;

    } else {
        cart.push({
            id:
                cartId,

            productId:
                product.id,

            name:
                variant ? `${product.name} - ${variant.name}` : product.name,

            variantId: variant ? variant.id : "",
            stockDeduction: deduction,

            price:
                Number(variant ? variant.sellingPrice : (product.sellingPrice || 0)),

            // A quarter, half, cup, etc. uses the matching fraction of
            // the base product cost so reports remain accurate.
            cost:
                Number(product.cost || 0) * deduction,

            quantity:
                1
        });
    }

    renderCart();
}


//======================================================
// REMOVE / CLEAR CART
//======================================================

function removeCartItem(cartId) {
    cart = cart.filter(
        item =>
            String(item.id) !==
            String(cartId)
    );

    renderCart();
}


function clearCart() {
    cart = [];

    const receipt =
        document.getElementById(
            "receipt-preview"
        );

    if (receipt) {
        receipt.innerHTML = `
            <div class="empty-state">
                Complete a sale to generate a receipt.
            </div>
        `;
    }

    const cashInput =
        document.getElementById(
            "cash-received"
        );

    if (cashInput) {
        cashInput.value = "";
    }

    const discountInput =
        document.getElementById(
            "discount-input"
        );

    if (discountInput) {
        discountInput.value = 0;
    }

    renderCart();
}


//======================================================
// RENDER PRODUCTS
//======================================================

function renderProducts(search = "") {
    const container =
        document.getElementById(
            "product-list"
        );

    if (!container) return;

    const keyword =
        String(search || "")
            .trim()
            .toLowerCase();

    const productList =
        Array.isArray(window.inventory)
            ? window.inventory
            : [];

    const products =
        productList.filter(product => {
            return (
                String(product.name || "")
                    .toLowerCase()
                    .includes(keyword) ||

                String(product.category || "")
                    .toLowerCase()
                    .includes(keyword) ||

                String(product.sku || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        });

    if (!products.length) {
        container.innerHTML = `
            <div class="empty-state">
                No products found.
            </div>
        `;

        return;
    }

    container.innerHTML =
        products.map(product => `
            <div class="product-card">

                <h3>
                    ${product.name || "-"}
                </h3>

                <div class="small">
                    ${product.category || "-"}
                </div>

                <div class="small">
                    SKU: ${product.sku || "-"}
                </div>

                <strong>
                    ${formatCurrency(
                        product.sellingPrice || 0
                    )}
                </strong>

                <div class="small">
                    Stock: ${product.stock || 0}
                </div>

                ${(() => {
                    const variants = typeof getProductVariations === "function"
                        ? getProductVariations(product.id, true)
                        : [];

                    if (!variants.length) {
                        return `<button class="primary-btn add-cart-btn" data-id="${product.id}" type="button">Add to Cart</button>`;
                    }

                    return `<div class="variant-buttons">${variants.map(variation => `
                        <button
                            class="secondary-btn add-cart-btn"
                            data-id="${product.id}"
                            data-variant-id="${variation.id}"
                            type="button"
                        >
                            ${variation.name} · ${formatCurrency(variation.sellingPrice)}
                        </button>
                    `).join("")}</div>`;
                })()}

            </div>
        `).join("");

    document
        .querySelectorAll(
            ".add-cart-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    addToCart(
                        button.dataset.id,
                        button.dataset.variantId || ""
                    );
                }
            );
        });
}


//======================================================
// RENDER CART
//======================================================

function renderCart() {
    const container =
        document.getElementById(
            "cart-items"
        );

    if (!container) return;

    if (!cart.length) {
        container.innerHTML = `
            <div class="empty-state">
                Cart is empty.
            </div>
        `;

        updateCartTotals();
        return;
    }

    container.innerHTML =
        cart.map(item => `
            <div class="cart-row">

                <div>
                    <strong>
                        ${item.name}
                    </strong>

                    <div class="small">
                        ${formatCurrency(
                            item.price
                        )}
                    </div>
                </div>

                <div class="cart-controls">

                    <input
                        type="number"
                        class="cart-qty-input"
                        data-id="${item.id}"
                        value="${item.quantity}"
                        min="0.01"
                        step="0.01">

                    <button
                        class="remove-cart"
                        data-id="${item.id}"
                        type="button">

                        ×

                    </button>

                </div>

            </div>
        `).join("");

    document
        .querySelectorAll(
            ".cart-qty-input"
        )
        .forEach(input => {
            input.addEventListener(
                "change",
                () => {
                    const item =
                        getCartItem(
                            input.dataset.id
                        );

                    if (!item) return;

                    const product =
                        getProductById(
                            item.productId ||
                            item.id
                        );

                    const quantity =
                        Number(input.value);

                    if (
                        !Number.isFinite(quantity) ||
                        quantity <= 0
                    ) {
                        removeCartItem(
                            item.id
                        );

                        return;
                    }

                    if (
                        product &&
                        quantity >
                        Number(product.stock || 0)
                    ) {
                        alert(
                            "Not enough stock."
                        );

                        input.value =
                            item.quantity;

                        return;
                    }

                    item.quantity =
                        quantity;

                    renderCart();
                }
            );
        });

    document
        .querySelectorAll(
            ".remove-cart"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    removeCartItem(
                        button.dataset.id,
                        button.dataset.variantId || ""
                    );
                }
            );
        });

    updateCartTotals();
}


//======================================================
// UPDATE TOTALS
//======================================================

function updateCartTotals() {
    const subtotal =
        getCartTotal();

    const total =
        getFinalTotal();

    const cartSubtotal =
        document.getElementById(
            "cart-subtotal"
        );

    const cartTotal =
        document.getElementById(
            "cart-total"
        );

    const oldSubtotal =
        document.getElementById(
            "subtotal"
        );

    const oldTotal =
        document.getElementById(
            "total"
        );

    const cartCount =
        document.getElementById(
            "cart-count"
        );

    if (cartSubtotal) {
        cartSubtotal.textContent =
            formatCurrency(subtotal);
    }

    if (cartTotal) {
        cartTotal.textContent =
            formatCurrency(total);
    }

    if (oldSubtotal) {
        oldSubtotal.textContent =
            formatCurrency(subtotal);
    }

    if (oldTotal) {
        oldTotal.textContent =
            formatCurrency(total);
    }

    if (cartCount) {
        cartCount.textContent =
            cart.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.quantity || 0
                    ),
                0
            );
    }
}


//======================================================
// PRODUCT SEARCH
//======================================================

function initializeProductSearch() {
    const input =
        document.getElementById(
            "search-input"
        );

    if (
        input &&
        !input.dataset.ready
    ) {
        input.dataset.ready =
            "true";

        input.addEventListener(
            "input",
            () => {
                renderProducts(
                    input.value
                );
            }
        );
    }

    const clear =
        document.getElementById(
            "clear-search"
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
                if (input) {
                    input.value = "";
                }

                renderProducts();
            }
        );
    }
}


//======================================================
// BARCODE
//======================================================

function addProductByBarcode() {
    const input =
        document.getElementById(
            "barcode-input"
        );

    if (!input) return;

    const barcode =
        input.value
            .trim()
            .toLowerCase();

    if (!barcode) return;

    const productList =
        Array.isArray(window.inventory)
            ? window.inventory
            : [];

    const product =
        productList.find(item => {
            return (
                String(item.sku || "")
                    .trim()
                    .toLowerCase() ===
                    barcode ||

                String(item.barcode || "")
                    .trim()
                    .toLowerCase() ===
                    barcode
            );
        });

    if (!product) {
        alert("Product not found.");
        input.select();
        return;
    }

    addToCart(product.id);

    input.value = "";
    input.focus();
}


function initializeBarcodeScanner() {
    const input =
        document.getElementById(
            "barcode-input"
        );

    const button =
        document.getElementById(
            "barcode-add-btn"
        );

    if (
        button &&
        !button.dataset.ready
    ) {
        button.dataset.ready =
            "true";

        button.addEventListener(
            "click",
            addProductByBarcode
        );
    }

    if (
        input &&
        !input.dataset.ready
    ) {
        input.dataset.ready =
            "true";

        input.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                    "Enter"
                ) {
                    event.preventDefault();
                    addProductByBarcode();
                }
            }
        );
    }
}


//======================================================
// CASHIER
//======================================================

function populateCashierDropdown() {
    const select =
        document.getElementById(
            "cashier-select"
        );

    if (!select) return;

    if (
        typeof getUsers !==
        "function"
    ) {
        return;
    }

    const activeUsers =
        getUsers().filter(user => {
            return (
                String(user.status || "")
                    .toLowerCase() ===
                "active"
            );
        });

    select.innerHTML = `
        <option value="">
            Select Cashier
        </option>
    `;

    activeUsers.forEach(user => {
        const option =
            document.createElement(
                "option"
            );

        option.value =
            user.id;

        option.textContent =
            `${user.name} - ${user.role}`;

        select.appendChild(option);
    });
}


function getSelectedCashier() {
    const currentUser =
        window.currentPOSUser ||
        null;

    if (currentUser) {
        return {
            id:
                currentUser.id ||
                currentUser.userId ||
                "",

            name:
                currentUser.fullName ||
                currentUser.name ||
                currentUser.email ||
                "Cashier"
        };
    }

    const select =
        document.getElementById(
            "cashier-select"
        );

    if (!select) return null;

    const cashierId =
        select.value;

    if (!cashierId) {
        return null;
    }

    if (
        typeof getUsers !==
        "function"
    ) {
        return null;
    }

    return (
        getUsers().find(
            user =>
                String(user.id) ===
                String(cashierId)
        ) || null
    );
}


//======================================================
// ADMIN-ONLY SALE DATE
//======================================================

function getCurrentPOSRole() {
    return String(
        window.currentPOSUser?.role ||
        ""
    )
        .trim()
        .toLowerCase();
}


function setSaleDateToNow() {
    const input =
        document.getElementById(
            "sale-date"
        );

    if (!input) return;

    const now =
        new Date();

    const localDateTime =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() *
            60000
        )
            .toISOString()
            .slice(0, 16);

    input.value =
        localDateTime;
}


async function configureSaleDateAccess() {
    const section =
        document.getElementById(
            "sale-date-section"
        );

    const input =
        document.getElementById(
            "sale-date"
        );

    if (!section || !input) {
        return;
    }

    // Hide it first while the role loads.
    section.style.display =
        "none";

    input.disabled =
        true;

    input.value =
        "";

    if (
        typeof loadCurrentPOSUser ===
        "function"
    ) {
        try {
            await loadCurrentPOSUser();
        } catch (error) {
            console.error(
                "Could not load user for sale-date access:",
                error
            );
        }
    }

    const isAdmin =
        getCurrentPOSRole() ===
        "admin";

    if (!isAdmin) {
        return;
    }

    section.style.display =
        "";

    input.disabled =
        false;

    setSaleDateToNow();
}


function getSelectedSaleDate() {
    // Cashiers must always use the real checkout time.
    if (
        getCurrentPOSRole() !==
        "admin"
    ) {
        return new Date()
            .toISOString();
    }

    const input =
        document.getElementById(
            "sale-date"
        );

    if (
        !input ||
        !input.value
    ) {
        return new Date()
            .toISOString();
    }

    const selectedDate =
        new Date(input.value);

    if (
        Number.isNaN(
            selectedDate.getTime()
        )
    ) {
        return new Date()
            .toISOString();
    }

    return selectedDate
        .toISOString();
}


//======================================================
// CHECKOUT
//======================================================

async function checkout() {
    if (!cart.length) {
        alert("Cart is empty.");
        return;
    }

    if (
        typeof loadCurrentPOSUser ===
        "function"
    ) {
        try {
            await loadCurrentPOSUser();
        } catch (error) {
            console.error(
                "Could not reload cashier session:",
                error
            );
        }
    }

    const cashier =
        getSelectedCashier();

    if (!cashier) {
        alert(
            "Cashier not found. Please log in again."
        );

        return;
    }

    const paymentMethod =
        document
            .getElementById(
                "payment-method"
            )
            ?.value ||
        "Cash";

    const total =
        getFinalTotal();

    const cashInput =
        document.getElementById(
            "cash-received"
        );

    const cashReceived =
        cashInput
            ? Number(cashInput.value)
            : total;

    if (
        cashInput &&
        (
            Number.isNaN(cashReceived) ||
            cashReceived < total
        )
    ) {
        alert(
            "Insufficient amount received."
        );

        return;
    }

    const saleDate =
        getSelectedSaleDate();

    cart.forEach(item => {
        const product =
            getProductById(
                item.productId ||
                item.id
            );

        if (!product) return;

        product.stock =
            Number(product.stock || 0) -
            Number(item.quantity || 0) * Number(item.stockDeduction || 1);

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
                    "Sale",

                quantity:
                    -Number(item.quantity || 0) *
                    Number(item.stockDeduction || 1),

                notes:
                    `POS sale - ${paymentMethod}`
            });
        }
    });

    const sale = {
        id:
            generateId("SALE-"),

        date:
            saleDate,

        cashierId:
            cashier.id || "",

        cashierName:
            cashier.name ||
            cashier.fullName ||
            "Admin",

        paymentMethod,

        items:
            cart.map(item => ({
                ...item
            })),

        subtotal:
            getCartTotal(),

        discount:
            getDiscountAmount(),

        total,

        cashReceived,

        change:
            cashReceived - total,

        cost:
            getCartCost(),

        profit:
            total -
            getCartCost()
    };

    sales.unshift(sale);

    saveState({
        inventory,
        sales
    });

    if (
        typeof saveSaleToSupabase ===
        "function"
    ) {
        try {
            const cloudSale =
                await saveSaleToSupabase(
                    sale
                );

            if (cloudSale) {
                console.log(
                    "Sale saved to Supabase:",
                    cloudSale.id
                );
            }
        } catch (error) {
            console.error(
                "Cloud sale error:",
                error
            );
        }
    }

    renderReceipt(sale);

    cart = [];

    if (cashInput) {
        cashInput.value = "";
    }

    const discountInput =
        document.getElementById(
            "discount-input"
        );

    if (discountInput) {
        discountInput.value = 0;
    }

    if (
        getCurrentPOSRole() ===
        "admin"
    ) {
        setSaleDateToNow();
    } else {
        const input =
            document.getElementById(
                "sale-date"
            );

        if (input) {
            input.value = "";
        }
    }

    renderProducts();
    renderCart();
    renderSales();
    renderBestSellers();

    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {
        updateDashboardMetrics();
    }
}


//======================================================
// RECEIPT
//======================================================

function renderReceipt(sale) {
    const container =
        document.getElementById(
            "receipt-preview"
        );

    if (!container) return;

    const settings =
        typeof getSettings ===
        "function"
            ? getSettings()
            : {
                storeName:
                    "TYS General Store",

                phone:
                    "",

                address:
                    "",

                receiptFooter:
                    "Thank you for shopping!"
            };

    container.innerHTML = `
        <div class="receipt-store">

            <h3>
                ${
                    settings.storeName ||
                    "TYS General Store"
                }
            </h3>

            ${
                settings.address
                    ? `
                        <div class="small">
                            ${settings.address}
                        </div>
                    `
                    : ""
            }

            ${
                settings.phone
                    ? `
                        <div class="small">
                            Tel: ${settings.phone}
                        </div>
                    `
                    : ""
            }

            <div class="small">
                Cashier: ${
                    sale.cashierName ||
                    "Admin"
                }
            </div>

            <div class="small">
                Payment: ${
                    sale.paymentMethod ||
                    "Cash"
                }
            </div>

        </div>

        <hr>

        <div class="small">
            ${
                new Date(
                    sale.date
                ).toLocaleString()
            }
        </div>

        <hr>

        ${
            sale.items.map(item => `
                <div class="receipt-row">

                    <span>
                        ${item.name}
                        x${item.quantity}
                    </span>

                    <strong>
                        ${
                            formatCurrency(
                                Number(item.price) *
                                Number(item.quantity)
                            )
                        }
                    </strong>

                </div>
            `).join("")
        }

        <hr>

        <div class="receipt-row">
            <span>Subtotal</span>
            <strong>
                ${formatCurrency(sale.subtotal)}
            </strong>
        </div>

        <div class="receipt-row">
            <span>Discount</span>
            <strong>
                ${formatCurrency(sale.discount || 0)}
            </strong>
        </div>

        <div class="receipt-row">
            <span>Total</span>
            <strong>
                ${formatCurrency(sale.total)}
            </strong>
        </div>

        <div class="receipt-row">
            <span>Amount Received</span>
            <strong>
                ${formatCurrency(sale.cashReceived)}
            </strong>
        </div>

        <div class="receipt-row">
            <span>Change</span>
            <strong>
                ${formatCurrency(sale.change)}
            </strong>
        </div>

        <hr>

        <center>
            ${
                settings.receiptFooter ||
                "Thank you for shopping!"
            }
        </center>
    `;
}


//======================================================
// PRINT RECEIPT
//======================================================

function printReceipt() {
    const receipt =
        document.getElementById(
            "receipt-preview"
        );

    if (
        !receipt ||
        !receipt.innerHTML.trim()
    ) {
        alert("No receipt to print.");
        return;
    }

    const printWindow =
        window.open(
            "",
            "_blank"
        );

    if (!printWindow) {
        alert(
            "The receipt window was blocked."
        );

        return;
    }

    printWindow.document.write(`
        <html>

        <head>

            <title>Receipt</title>

            <style>
                body {
                    font-family: monospace;
                    width: 280px;
                    padding: 10px;
                }

                h3 {
                    text-align: center;
                    margin: 0 0 10px;
                }

                .receipt-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 6px 0;
                }

                hr {
                    border: none;
                    border-top: 1px dashed #000;
                    margin: 10px 0;
                }

                center {
                    margin-top: 10px;
                }
            </style>

        </head>

        <body>
            ${receipt.innerHTML}
        </body>

        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}


//======================================================
// SALES HISTORY
//======================================================

function getPOSSelectedSalesDate() {
    const input = document.getElementById("pos-sales-date");
    if (input && input.value) return input.value;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function localDateKey(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function renderSales() {
    const salesHistory = document.getElementById("sales-history");
    const salesList = document.getElementById("sales-list");
    const selectedDate = getPOSSelectedSalesDate();
    const daySales = (Array.isArray(sales) ? sales : [])
        .filter(sale => localDateKey(sale.date) === selectedDate)
        .sort((a,b) => new Date(a.date) - new Date(b.date));

    const transactionEl = document.getElementById("pos-day-transactions");
    const itemsEl = document.getElementById("pos-day-items");
    const totalEl = document.getElementById("pos-day-total");
    const itemQty = daySales.reduce((sum,sale) => sum + (sale.items || []).reduce((x,item)=>x+Number(item.quantity||0),0),0);
    const dayTotal = daySales.reduce((sum,sale)=>sum+Number(sale.total||0),0);
    if (transactionEl) transactionEl.textContent = daySales.length;
    if (itemsEl) itemsEl.textContent = itemQty;
    if (totalEl) totalEl.textContent = formatCurrency(dayTotal);

    if (salesHistory) {
        salesHistory.innerHTML = daySales.length ? daySales.map(sale => `
            <div class="sales-row"><div><strong>${new Date(sale.date).toLocaleString()}</strong>
            <div class="small">${(sale.items||[]).map(i=>`${i.name} × ${i.quantity}`).join(", ") || "No item details"} • Cashier: ${sale.cashierName||"Admin"} • ${sale.paymentMethod||"Cash"}</div></div>
            <strong>${formatCurrency(sale.total||0)}</strong></div>`).join("") : '<div class="empty-state">No sales recorded for this day.</div>';
    }

    if (salesList) {
        salesList.innerHTML = daySales.length ? daySales.map(sale => `
            <tr><td>${formatDateTime(sale.date)}</td>
            <td>${(sale.items||[]).map(i=>`${i.name} × ${i.quantity}`).join("<br>") || "-"}</td>
            <td>${formatCurrency(sale.subtotal||sale.total||0)}</td>
            <td>${formatCurrency(sale.discount||0)}</td>
            <td>${formatCurrency(sale.total||0)}</td></tr>`).join("") : '<tr><td colspan="5"><div class="empty-state">No sales recorded for this day.</div></td></tr>';
    }
}

function initializePOSSalesDateFilter() {
    const input=document.getElementById("pos-sales-date");
    if (!input) return;
    if (!input.value) input.value=getPOSSelectedSalesDate();
    input.addEventListener("change", renderSales);
    document.getElementById("pos-sales-today")?.addEventListener("click",()=>{
        const d=new Date(); input.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; renderSales();
    });
}

//======================================================
// BEST SELLERS
//======================================================

function renderBestSellers() {
    const container =
        document.getElementById(
            "best-sellers"
        );

    if (!container) return;

    if (!sales.length) {
        container.innerHTML = `
            <div class="empty-state">
                No sales yet.
            </div>
        `;

        return;
    }

    const totals = {};

    sales.forEach(sale => {
        (sale.items || [])
            .forEach(item => {
                if (!totals[item.name]) {
                    totals[item.name] = 0;
                }

                totals[item.name] +=
                    Number(
                        item.quantity || 0
                    );
            });
    });

    const ranked =
        Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 5);

    container.innerHTML =
        ranked.map(
            ([name, quantity]) => `
                <div class="sales-row">

                    <div>

                        <strong>
                            ${name}
                        </strong>

                        <div class="small">
                            Top-selling item
                        </div>

                    </div>

                    <strong>
                        ${quantity} sold
                    </strong>

                </div>
            `
        ).join("");
}


//======================================================
// MOBILE CART
//======================================================

function initializeMobileCartToggle() {
    const toggle =
        document.getElementById(
            "mobile-cart-toggle"
        );

    const cartPanel =
        document.querySelector(
            ".cart-panel"
        );

    if (
        !toggle ||
        !cartPanel ||
        toggle.dataset.ready
    ) {
        return;
    }

    toggle.dataset.ready =
        "true";

    toggle.addEventListener(
        "click",
        () => {
            const isOpen =
                cartPanel.classList
                    .toggle(
                        "mobile-open"
                    );

            toggle.textContent =
                isOpen
                    ? "Close Cart"
                    : "View Cart";
        }
    );
}


//======================================================
// INITIALIZE
//======================================================

async function initializeSalesModule() {
    renderProducts();
    renderCart();
    renderSales();
    renderBestSellers();

    initializeProductSearch();
    initializeBarcodeScanner();
    populateCashierDropdown();
    initializeMobileCartToggle();

    await configureSaleDateAccess();

    const checkoutButton =
        document.getElementById(
            "checkout-btn"
        );

    if (
        checkoutButton &&
        !checkoutButton.dataset.ready
    ) {
        checkoutButton.dataset.ready =
            "true";

        checkoutButton.addEventListener(
            "click",
            checkout
        );
    }

    const clearCartButton =
        document.getElementById(
            "clear-cart-btn"
        );

    if (
        clearCartButton &&
        !clearCartButton.dataset.ready
    ) {
        clearCartButton.dataset.ready =
            "true";

        clearCartButton.addEventListener(
            "click",
            clearCart
        );
    }

    const printButton =
        document.getElementById(
            "print-receipt-btn"
        );

    if (
        printButton &&
        !printButton.dataset.ready
    ) {
        printButton.dataset.ready =
            "true";

        printButton.addEventListener(
            "click",
            printReceipt
        );
    }

    const discountInput =
        document.getElementById(
            "discount-input"
        );

    if (
        discountInput &&
        !discountInput.dataset.ready
    ) {
        discountInput.dataset.ready =
            "true";

        discountInput.addEventListener(
            "input",
            updateCartTotals
        );
    }
}


//======================================================
// REFRESH
//======================================================

function refreshSales() {
    renderProducts();
    renderCart();
    renderSales();
    renderBestSellers();

    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {
        updateDashboardMetrics();
    }
}

document.addEventListener("DOMContentLoaded", initializePOSSalesDateFilter, { once: true });
