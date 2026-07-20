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

function addToCart(productId) {
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

    const existing =
        getCartItem(product.id);

    if (existing) {
        if (
            Number(existing.quantity) >=
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
                product.id,

            productId:
                product.id,

            name:
                product.name,

            price:
                Number(
                    product.sellingPrice || 0
                ),

            cost:
                Number(
                    product.cost || 0
                ),

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

                <button
                    class="primary-btn add-cart-btn"
                    data-id="${product.id}"
                    type="button">

                    Add to Cart

                </button>

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
                        button.dataset.id
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
                        button.dataset.id
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

    const totalItems = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    const mobileToggle = document.getElementById("mobile-cart-toggle");
    const cartPanel = document.querySelector(".cart-panel");

    if (mobileToggle && !cartPanel?.classList.contains("mobile-open")) {
        mobileToggle.textContent = `View Cart (${totalItems})`;
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
// PHONE CAMERA BARCODE SCANNER
//======================================================

let cameraBarcodeStream = null;
let cameraBarcodeDetector = null;
let cameraBarcodeScanning = false;
let cameraBarcodeFrame = null;


//------------------------------------------------------
// UPDATE CAMERA MESSAGE
//------------------------------------------------------

function setCameraScannerStatus(
    message
) {
    const status =
        document.getElementById(
            "camera-scanner-status"
        );

    if (status) {
        status.textContent =
            message;
    }
}


//------------------------------------------------------
// STOP PHONE CAMERA
//------------------------------------------------------

function stopCameraBarcodeScanner() {
    cameraBarcodeScanning =
        false;

    if (cameraBarcodeFrame) {
        cancelAnimationFrame(
            cameraBarcodeFrame
        );

        cameraBarcodeFrame =
            null;
    }

    if (cameraBarcodeStream) {
        cameraBarcodeStream
            .getTracks()
            .forEach(track => {
                track.stop();
            });

        cameraBarcodeStream =
            null;
    }

    const video =
        document.getElementById(
            "camera-scanner-video"
        );

    if (video) {
        video.pause();
        video.srcObject =
            null;
    }

    const panel =
        document.getElementById(
            "camera-scanner-panel"
        );

    if (panel) {
        panel.hidden =
            true;
    }

    const button =
        document.getElementById(
            "camera-scan-btn"
        );

    if (button) {
        button.disabled =
            false;

        button.textContent =
            "📷 Scan with Camera";
    }
}


//------------------------------------------------------
// USE DETECTED BARCODE
//------------------------------------------------------

function useCameraBarcode(
    barcode
) {
    const cleanBarcode =
        String(
            barcode || ""
        )
            .trim();

    if (!cleanBarcode) {
        return;
    }

    const input =
        document.getElementById(
            "barcode-input"
        );

    if (!input) {
        stopCameraBarcodeScanner();

        alert(
            "The barcode input was not found."
        );

        return;
    }

    input.value =
        cleanBarcode;

    stopCameraBarcodeScanner();

    addProductByBarcode();
}


//------------------------------------------------------
// KEEP CHECKING CAMERA FOR BARCODES
//------------------------------------------------------

async function detectCameraBarcode() {
    if (
        !cameraBarcodeScanning ||
        !cameraBarcodeDetector
    ) {
        return;
    }

    const video =
        document.getElementById(
            "camera-scanner-video"
        );

    if (
        !video ||
        video.readyState < 2
    ) {
        cameraBarcodeFrame =
            requestAnimationFrame(
                detectCameraBarcode
            );

        return;
    }

    try {
        const barcodes =
            await cameraBarcodeDetector
                .detect(video);

        if (
            barcodes &&
            barcodes.length
        ) {
            const barcode =
                barcodes[0]
                    .rawValue;

            if (barcode) {
                setCameraScannerStatus(
                    `Barcode detected: ${barcode}`
                );

                useCameraBarcode(
                    barcode
                );

                return;
            }
        }

    } catch (error) {
        console.warn(
            "Camera barcode detection failed:",
            error
        );
    }

    if (cameraBarcodeScanning) {
        cameraBarcodeFrame =
            requestAnimationFrame(
                detectCameraBarcode
            );
    }
}


//------------------------------------------------------
// OPEN PHONE CAMERA
//------------------------------------------------------

async function startCameraBarcodeScanner() {
    if (
        !window.isSecureContext
    ) {
        alert(
            "Camera scanning requires the secure online HTTPS version of the POS."
        );

        return;
    }

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
            .getUserMedia
    ) {
        alert(
            "This browser cannot access the camera."
        );

        return;
    }

    if (
        !("BarcodeDetector" in window)
    ) {
        alert(
            "Camera barcode detection is not supported by this browser. Please use Chrome on Android, or continue using the USB scanner."
        );

        return;
    }

    const panel =
        document.getElementById(
            "camera-scanner-panel"
        );

    const video =
        document.getElementById(
            "camera-scanner-video"
        );

    const button =
        document.getElementById(
            "camera-scan-btn"
        );

    if (
        !panel ||
        !video
    ) {
        alert(
            "The camera scanner section is missing from index.html."
        );

        return;
    }

    try {
        button.disabled =
            true;

        button.textContent =
            "Opening Camera...";

        panel.hidden =
            false;

        setCameraScannerStatus(
            "Allow camera access, then point the rear camera at the barcode."
        );

        cameraBarcodeStream =
            await navigator
                .mediaDevices
                .getUserMedia({
                    audio:
                        false,

                    video: {
                        facingMode: {
                            ideal:
                                "environment"
                        },

                        width: {
                            ideal:
                                1280
                        },

                        height: {
                            ideal:
                                720
                        }
                    }
                });

        video.srcObject =
            cameraBarcodeStream;

        await video.play();

        const supportedFormats =
            await BarcodeDetector
                .getSupportedFormats();

        const preferredFormats = [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "itf"
        ];

        const availableFormats =
            preferredFormats.filter(
                format =>
                    supportedFormats
                        .includes(
                            format
                        )
            );

        cameraBarcodeDetector =
            availableFormats.length
                ? new BarcodeDetector({
                    formats:
                        availableFormats
                })
                : new BarcodeDetector();

        cameraBarcodeScanning =
            true;

        button.textContent =
            "Camera Open";

        setCameraScannerStatus(
            "Point the camera at the barcode. Keep the barcode clear and steady."
        );

        detectCameraBarcode();

    } catch (error) {
        console.error(
            "Could not open camera:",
            error
        );

        stopCameraBarcodeScanner();

        if (
            error.name ===
            "NotAllowedError"
        ) {
            alert(
                "Camera permission was denied. Allow camera access in the browser settings and try again."
            );

            return;
        }

        if (
            error.name ===
            "NotFoundError"
        ) {
            alert(
                "No camera was found on this device."
            );

            return;
        }

        alert(
            `Could not open the camera: ${
                error.message ||
                "Unknown camera error"
            }`
        );
    }
}


//------------------------------------------------------
// INITIALIZE PHONE CAMERA SCANNER
//------------------------------------------------------

function initializeCameraBarcodeScanner() {
    const openButton =
        document.getElementById(
            "camera-scan-btn"
        );

    const closeButton =
        document.getElementById(
            "close-camera-scanner-btn"
        );

    if (
        openButton &&
        !openButton.dataset.ready
    ) {
        openButton.dataset.ready =
            "true";

        openButton.addEventListener(
            "click",
            startCameraBarcodeScanner
        );
    }

    if (
        closeButton &&
        !closeButton.dataset.ready
    ) {
        closeButton.dataset.ready =
            "true";

        closeButton.addEventListener(
            "click",
            stopCameraBarcodeScanner
        );
    }

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.hidden &&
                cameraBarcodeScanning
            ) {
                stopCameraBarcodeScanner();
            }
        }
    );
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
            Number(item.quantity || 0);

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
                    -Number(
                        item.quantity || 0
                    ),

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

function renderSales() {
    const salesHistory =
        document.getElementById(
            "sales-history"
        );

    const salesList =
        document.getElementById(
            "sales-list"
        );

    if (salesHistory) {
        if (!sales.length) {
            salesHistory.innerHTML = `
                <div class="empty-state">
                    No sales recorded yet.
                </div>
            `;
        } else {
            salesHistory.innerHTML =
                sales
                    .slice(0, 10)
                    .map(sale => `
                        <div class="sales-row">

                            <div>

                                <strong>
                                    ${
                                        new Date(
                                            sale.date
                                        ).toLocaleString()
                                    }
                                </strong>

                                <div class="small">

                                    ${
                                        (
                                            sale.items ||
                                            []
                                        ).length
                                    } item(s)

                                    • Cashier:
                                    ${
                                        sale.cashierName ||
                                        "Admin"
                                    }

                                    • Payment:
                                    ${
                                        sale.paymentMethod ||
                                        "Cash"
                                    }

                                </div>

                            </div>

                            <div>
                                <strong>
                                    ${
                                        formatCurrency(
                                            sale.total
                                        )
                                    }
                                </strong>
                            </div>

                        </div>
                    `)
                    .join("");
        }
    }

    if (salesList) {
        if (!sales.length) {
            salesList.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="empty-state">
                            No sales recorded.
                        </div>
                    </td>
                </tr>
            `;
        } else {
            salesList.innerHTML =
                sales
                    .slice(0, 10)
                    .map(sale => `
                        <tr>

                            <td>
                                ${
                                    formatDateTime(
                                        sale.date
                                    )
                                }
                            </td>

                            <td>
                                ${
                                    (
                                        sale.items ||
                                        []
                                    ).length
                                }
                            </td>

                            <td>
                                ${
                                    formatCurrency(
                                        sale.subtotal ||
                                        sale.total ||
                                        0
                                    )
                                }
                            </td>

                            <td>
                                ${
                                    formatCurrency(
                                        sale.discount ||
                                        0
                                    )
                                }
                            </td>

                            <td>
                                ${
                                    formatCurrency(
                                        sale.total ||
                                        0
                                    )
                                }
                            </td>

                        </tr>
                    `)
                    .join("");
        }
    }
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
    const toggle = document.getElementById("mobile-cart-toggle");
    const cartPanel = document.querySelector(".cart-panel");
    const catalogSection = document.querySelector(".catalog-section");

    if (!toggle || !cartPanel) {
        console.warn("Mobile cart controls were not found.");
        return;
    }

    if (toggle.dataset.ready === "true") return;
    toggle.dataset.ready = "true";

    const setOpenState = open => {
        cartPanel.classList.toggle("mobile-open", open);
        catalogSection?.classList.toggle("mobile-cart-hidden", open);
        document.body.classList.toggle("mobile-cart-is-open", open);
        toggle.setAttribute("aria-expanded", String(open));

        const totalItems = cart.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
        );

        toggle.textContent = open
            ? "Close Cart"
            : `View Cart (${totalItems})`;

        if (open) {
            cartPanel.scrollTop = 0;
        }
    };

    toggle.setAttribute("aria-controls", "mobile-cart-panel");
    toggle.setAttribute("aria-expanded", "false");
    cartPanel.id = cartPanel.id || "mobile-cart-panel";

    toggle.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        setOpenState(!cartPanel.classList.contains("mobile-open"));
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768 && cartPanel.classList.contains("mobile-open")) {
            setOpenState(false);
        }
    });

    updateCartTotals();
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
    initializeCameraBarcodeScanner();
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