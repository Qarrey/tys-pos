//======================================================
// TYS POS v3
// INVENTORY MODULE
//======================================================

let editingProductId = null;


//======================================================
// NORMALIZE INVENTORY
//======================================================

function normalizeInventory(products = []) {
    return products.map(product => ({
        id: product.id || generateId("P-"),

        name:
            product.name || "",

        category:
            product.category || "",

        sku:
            product.sku || "",

        barcode:
            product.barcode || "",

        supplierId:
            product.supplierId ||
            product.supplier_id ||
            "",

        cost:
            Number(
                product.cost || 0
            ),

        sellingPrice:
            Number(
                product.sellingPrice ??
                product.selling_price ??
                product.price ??
                0
            ),

        stock:
            Number(
                product.stock || 0
            ),

        lowStock:
            Number(
                product.lowStock ??
                product.low_stock ??
                5
            )
    }));
}


//======================================================
// SAVE INVENTORY LOCALLY
//======================================================

function persistInventory() {
    saveState({
        inventory,
        sales
    });
}


//======================================================
// GET PRODUCT
//======================================================

function getProductById(id) {
    return inventory.find(
        product =>
            String(product.id) ===
            String(id)
    );
}


//======================================================
// SAVE PRODUCT
//======================================================

function saveProduct() {
    const product = {
        id:
            editingProductId ||
            generateId("P-"),

        name:
            document
                .getElementById(
                    "product-name"
                )
                .value
                .trim(),

        sku:
            document
                .getElementById(
                    "product-sku"
                )
                .value
                .trim(),

        category:
            document
                .getElementById(
                    "product-category"
                )
                .value
                .trim(),

        supplierId:
            document
                .getElementById(
                    "product-supplier"
                )
                ?.value || "",

        cost:
            toNumber(
                document
                    .getElementById(
                        "product-cost"
                    )
                    .value
            ),

        sellingPrice:
            toNumber(
                document
                    .getElementById(
                        "product-selling-price"
                    )
                    .value
            ),

        stock:
            toNumber(
                document
                    .getElementById(
                        "product-stock"
                    )
                    .value
            ),

        lowStock:
            toNumber(
                document
                    .getElementById(
                        "product-low-stock"
                    )
                    .value || 5
            )
    };


    if (!product.name) {
        alert(
            "Product name is required."
        );

        return;
    }


    if (editingProductId) {
        const index =
            inventory.findIndex(
                currentProduct =>
                    String(
                        currentProduct.id
                    ) ===
                    String(
                        editingProductId
                    )
            );

        if (index !== -1) {
            inventory[index] =
                product;
        }

        showFeedback(
            "Product updated."
        );

    } else {
        inventory.unshift(
            product
        );

        showFeedback(
            "Product added."
        );
    }


    editingProductId = null;

    persistInventory();

    renderInventory();


    if (
        typeof populateProductDropdown ===
        "function"
    ) {
        populateProductDropdown();
    }


    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {
        updateDashboardMetrics();
    }


    const form =
        document.getElementById(
            "inventory-form"
        );

    if (form) {
        form.reset();
    }


    const saveButton =
        document.querySelector(
            "#inventory-form button[type='submit']"
        );

    if (saveButton) {
        saveButton.textContent =
            "Save Product";
    }
}


//======================================================
// EDIT PRODUCT
//======================================================

function editProduct(id) {
    const product =
        getProductById(id);

    if (!product) {
        alert(
            "Product not found."
        );

        return;
    }


    editingProductId =
        product.id;


    document
        .getElementById(
            "product-name"
        )
        .value =
        product.name || "";


    document
        .getElementById(
            "product-sku"
        )
        .value =
        product.sku || "";


    document
        .getElementById(
            "product-category"
        )
        .value =
        product.category || "";


    document
        .getElementById(
            "product-cost"
        )
        .value =
        product.cost || 0;


    document
        .getElementById(
            "product-selling-price"
        )
        .value =
        product.sellingPrice || 0;


    document
        .getElementById(
            "product-stock"
        )
        .value =
        product.stock || 0;


    document
        .getElementById(
            "product-low-stock"
        )
        .value =
        product.lowStock || 5;


    const supplier =
        document.getElementById(
            "product-supplier"
        );

    if (supplier) {
        supplier.value =
            product.supplierId || "";
    }


    const button =
        document.querySelector(
            "#inventory-form button[type='submit']"
        );

    if (button) {
        button.textContent =
            "Update Product";
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


//======================================================
// DELETE PRODUCT
//======================================================

function deleteProduct(id) {
    const product =
        getProductById(id);

    if (!product) {
        return;
    }


    if (
        !confirmDelete(
            `Delete "${product.name}"?`
        )
    ) {
        return;
    }


    inventory =
        inventory.filter(
            currentProduct =>
                String(
                    currentProduct.id
                ) !==
                String(id)
        );


    persistInventory();

    renderInventory();


    if (
        typeof populateProductDropdown ===
        "function"
    ) {
        populateProductDropdown();
    }


    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {
        updateDashboardMetrics();
    }


    showFeedback(
        "Product deleted."
    );
}


//======================================================
// ADJUST STOCK
//======================================================

function adjustStock(
    productId,
    quantity
) {
    const product =
        getProductById(
            productId
        );

    if (!product) {
        return;
    }


    const reason =
        prompt(
            "Reason for stock adjustment?\n\n" +
            "Examples:\n" +
            "Purchase\n" +
            "Damaged\n" +
            "Expired\n" +
            "Returned\n" +
            "Stock Count",

            quantity > 0
                ? "Stock In"
                : "Stock Out"
        );


    if (reason === null) {
        return;
    }


    if (
        Number(product.stock) +
        Number(quantity) <
        0
    ) {
        alert(
            "Insufficient stock."
        );

        return;
    }


    product.stock =
        Number(product.stock) +
        Number(quantity);


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
                quantity > 0
                    ? "Stock In"
                    : "Stock Out",

            quantity,

            notes:
                reason
        });
    }


    persistInventory();

    renderInventory();


    if (
        typeof populateProductDropdown ===
        "function"
    ) {
        populateProductDropdown();
    }


    if (
        typeof updateDashboardMetrics ===
        "function"
    ) {
        updateDashboardMetrics();
    }


    showFeedback(
        "Stock updated."
    );
}


//======================================================
// INVENTORY METRICS
//======================================================

function updateInventoryMetrics() {
    const productMetric =
        document.getElementById(
            "metric-products"
        );


    if (productMetric) {
        productMetric.textContent =
            inventory.length;
    }


    const lowStockMetric =
        document.getElementById(
            "metric-low-stock"
        );


    if (lowStockMetric) {
        lowStockMetric.textContent =
            inventory.filter(
                product =>
                    Number(
                        product.stock || 0
                    ) <=
                    Number(
                        product.lowStock || 5
                    )
            ).length;
    }


    const outStockMetric =
        document.getElementById(
            "metric-out-stock"
        );


    if (outStockMetric) {
        outStockMetric.textContent =
            inventory.filter(
                product =>
                    Number(
                        product.stock || 0
                    ) <= 0
            ).length;
    }


    const valueMetric =
        document.getElementById(
            "metric-inventory-value"
        );


    if (valueMetric) {
        const total =
            inventory.reduce(
                (
                    sum,
                    product
                ) => {
                    return (
                        sum +
                        (
                            Number(
                                product.cost ||
                                0
                            ) *
                            Number(
                                product.stock ||
                                0
                            )
                        )
                    );
                },
                0
            );


        valueMetric.textContent =
            formatCurrency(
                total
            );
    }
}


//======================================================
// RENDER INVENTORY
//======================================================

function renderInventory(
    search = ""
) {
    const list =
        document.getElementById(
            "inventory-list"
        );


    if (!list) {
        return;
    }


    const keyword =
        String(search)
            .trim()
            .toLowerCase();


    const filtered =
        inventory.filter(
            product => {
                return (
                    String(
                        product.name || ""
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        ) ||

                    String(
                        product.category ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        ) ||

                    String(
                        product.sku || ""
                    )
                        .toLowerCase()
                        .includes(
                            keyword
                        )
                );
            }
        );


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


    list.innerHTML =
        filtered
            .map(
                product => {

                    let supplier = null;


                    if (
                        typeof getSuppliers ===
                        "function"
                    ) {
                        supplier =
                            getSuppliers()
                                .find(
                                    currentSupplier =>
                                        String(
                                            currentSupplier.id
                                        ) ===
                                        String(
                                            product.supplierId
                                        )
                                );
                    }


                    const status =
                        Number(
                            product.stock
                        ) <= 0

                            ? "Out of Stock"

                            : Number(
                                product.stock
                            ) <=
                            Number(
                                product.lowStock ||
                                5
                            )

                            ? "Low Stock"

                            : "In Stock";


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

                                ${product.category || "-"}

                            </td>


                            <td>

                                ${
                                    supplier
                                        ? supplier.name
                                        : "-"
                                }

                            </td>


                            <td>

                                ${
                                    formatCurrency(
                                        product.cost
                                    )
                                }

                            </td>


                            <td>

                                ${
                                    formatCurrency(
                                        product.sellingPrice
                                    )
                                }

                            </td>


                            <td>

                                ${product.stock}

                            </td>


                            <td>

                                ${status}

                            </td>


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
                }
            )
            .join("");


    document
        .querySelectorAll(
            ".edit-product"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        editProduct(
                            button.dataset.id
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".stock-in"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {

                        const quantity =
                            Number(
                                prompt(
                                    "Quantity to ADD",
                                    1
                                )
                            );


                        if (
                            !quantity ||
                            quantity <= 0
                        ) {
                            return;
                        }


                        adjustStock(
                            button.dataset.id,
                            quantity
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".stock-out"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {

                        const quantity =
                            Number(
                                prompt(
                                    "Quantity to REMOVE",
                                    1
                                )
                            );


                        if (
                            !quantity ||
                            quantity <= 0
                        ) {
                            return;
                        }


                        adjustStock(
                            button.dataset.id,
                            -quantity
                        );
                    }
                );
            }
        );


    document
        .querySelectorAll(
            ".delete-product"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    () => {
                        deleteProduct(
                            button.dataset.id
                        );
                    }
                );
            }
        );
}


//======================================================
// INVENTORY SEARCH
//======================================================

function initializeInventorySearch() {
    const input =
        document.getElementById(
            "inventory-search"
        );


    if (!input) {
        return;
    }


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
            renderInventory(
                input.value
            );
        }
    );


    const clear =
        document.getElementById(
            "clear-search"
        );


    if (clear) {
        clear.addEventListener(
            "click",
            () => {

                input.value = "";

                renderInventory();
            }
        );
    }
}


//======================================================
// SUPPLIER DROPDOWN
//======================================================

function populateProductSupplierDropdown() {
    const select =
        document.getElementById(
            "product-supplier"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">

            Select Supplier

        </option>
    `;


    if (
        typeof getSuppliers !==
        "function"
    ) {
        return;
    }


    getSuppliers()
        .forEach(
            supplier => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    supplier.id;


                option.textContent =
                    supplier.name;


                select.appendChild(
                    option
                );
            }
        );
}


//======================================================
// EXPORT INVENTORY
//======================================================

function exportInventory() {
    if (
        typeof downloadJSON !==
        "function"
    ) {
        alert(
            "Export function is unavailable."
        );

        return;
    }


    downloadJSON(
        "inventory-backup.json",
        inventory
    );
}


//======================================================
// EXCEL INVENTORY IMPORT
//
// MATCH ORDER:
//
// 1. SKU
// 2. BARCODE
// 3. PRODUCT NAME
//
// EXCEL "ON HAND" REPLACES CURRENT STOCK.
//======================================================


//------------------------------------------------------
// NORMALIZE EXCEL HEADING
//------------------------------------------------------

function normalizeExcelHeading(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        );
}


//------------------------------------------------------
// NORMALIZE PRODUCT MATCH VALUE
//------------------------------------------------------

function normalizeImportMatchValue(
    value
) {
    return String(
        value || ""
    )
        .trim()
        .toLowerCase();
}


//------------------------------------------------------
// GET EXCEL VALUE
//------------------------------------------------------

function getExcelRowValue(
    row,
    possibleNames
) {
    if (
        !row ||
        typeof row !==
        "object"
    ) {
        return "";
    }


    const normalizedRow = {};


    Object
        .entries(row)
        .forEach(
            (
                [
                    key,
                    value
                ]
            ) => {

                normalizedRow[
                    normalizeExcelHeading(
                        key
                    )
                ] = value;
            }
        );


    for (
        const name
        of possibleNames
    ) {
        const normalizedName =
            normalizeExcelHeading(
                name
            );


        if (
            Object
                .prototype
                .hasOwnProperty
                .call(
                    normalizedRow,
                    normalizedName
                )
        ) {
            return normalizedRow[
                normalizedName
            ];
        }
    }


    return "";
}


//------------------------------------------------------
// CONVERT EXCEL VALUE TO NUMBER
//------------------------------------------------------

function getExcelNumber(
    value,
    fallback = 0
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }


    if (
        typeof value ===
        "number" &&

        Number.isFinite(
            value
        )
    ) {
        return value;
    }


    const cleaned =
        String(value)
            .replace(
                /,/g,
                ""
            )
            .replace(
                /[^\d.-]/g,
                ""
            )
            .trim();


    const number =
        Number(
            cleaned
        );


    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


//------------------------------------------------------
// MAP EXCEL ROW
//------------------------------------------------------

function mapExcelRowToProduct(
    row,
    rowNumber
) {

    const name =
        String(
            getExcelRowValue(
                row,
                [
                    "ITEM",
                    "Product Name",
                    "Product",
                    "Item Name",
                    "Item",
                    "Name",
                    "Description"
                ]
            ) || ""
        )
            .trim();


    const sku =
        String(
            getExcelRowValue(
                row,
                [
                    "SKU",
                    "SKU / Barcode",
                    "Product SKU",
                    "Item Code",
                    "Product Code",
                    "Code"
                ]
            ) || ""
        )
            .trim();


    const barcode =
        String(
            getExcelRowValue(
                row,
                [
                    "Barcode",
                    "Bar Code",
                    "EAN",
                    "UPC"
                ]
            ) || ""
        )
            .trim();


    const category =
        String(
            getExcelRowValue(
                row,
                [
                    "Category",
                    "Product Category",
                    "Group"
                ]
            ) || ""
        )
            .trim();


    const cost =
        getExcelNumber(
            getExcelRowValue(
                row,
                [
                    "Cost",
                    "Cost Price",
                    "Buying Price",
                    "Purchase Price",
                    "Unit Cost",
                    "CP"
                ]
            ),
            0
        );


    const sellingPrice =
        getExcelNumber(
            getExcelRowValue(
                row,
                [
                    "Selling Price",
                    "Sale Price",
                    "Retail Price",
                    "Price",
                    "SP"
                ]
            ),
            0
        );


    //--------------------------------------------------
    // ON HAND IS THE CURRENT EXCEL STOCK
    //--------------------------------------------------

    const stock =
        getExcelNumber(
            getExcelRowValue(
                row,
                [
                    "ON HAND",
                    "On Hand",
                    "Stock",
                    "Current Stock",
                    "Opening Stock",
                    "Initial Stock",
                    "Quantity",
                    "Qty",
                    "Balance",
                    "Stock Quantity"
                ]
            ),
            0
        );


    const lowStock =
        getExcelNumber(
            getExcelRowValue(
                row,
                [
                    "Low Stock",
                    "Low Stock Alert",
                    "Reorder Level",
                    "Minimum Stock",
                    "Min Stock"
                ]
            ),
            5
        );


    if (!name) {
        return {
            valid:
                false,

            rowNumber,

            reason:
                "Product name is missing."
        };
    }


    if (stock < 0) {
        return {
            valid:
                false,

            rowNumber,

            name,

            reason:
                "Stock cannot be negative."
        };
    }


    return {
        valid:
            true,

        rowNumber,

        product: {
            name,
            sku,
            barcode,
            category,
            cost,
            sellingPrice,
            stock,
            lowStock
        }
    };
}


//======================================================
// FIND EXISTING PRODUCT
//======================================================

function findExistingImportProduct(
    importedProduct,
    existingProducts
) {

    const importedSku =
        normalizeImportMatchValue(
            importedProduct.sku
        );


    const importedBarcode =
        normalizeImportMatchValue(
            importedProduct.barcode
        );


    const importedName =
        normalizeImportMatchValue(
            importedProduct.name
        );


    //--------------------------------------------------
    // MATCH BY SKU
    //--------------------------------------------------

    if (importedSku) {
        const skuMatch =
            existingProducts.find(
                product =>
                    normalizeImportMatchValue(
                        product.sku
                    ) ===
                    importedSku
            );


        if (skuMatch) {
            return skuMatch;
        }
    }


    //--------------------------------------------------
    // MATCH BY BARCODE
    //--------------------------------------------------

    if (importedBarcode) {
        const barcodeMatch =
            existingProducts.find(
                product =>
                    normalizeImportMatchValue(
                        product.barcode
                    ) ===
                    importedBarcode
            );


        if (barcodeMatch) {
            return barcodeMatch;
        }
    }


    //--------------------------------------------------
    // MATCH BY PRODUCT NAME
    //--------------------------------------------------

    if (importedName) {
        return (
            existingProducts.find(
                product =>
                    normalizeImportMatchValue(
                        product.name
                    ) ===
                    importedName
            ) ||
            null
        );
    }


    return null;
}


//======================================================
// READ INVENTORY WORKSHEET
//======================================================

async function readInventorySpreadsheet(
    file
) {

    if (
        typeof XLSX ===
        "undefined"
    ) {
        throw new Error(
            "The Excel reader did not load. Refresh the page and try again."
        );
    }


    const fileData =
        await file.arrayBuffer();


    const workbook =
        XLSX.read(
            fileData,
            {
                type:
                    "array",

                cellDates:
                    true
            }
        );


    if (
        !workbook.SheetNames ||
        workbook.SheetNames.length ===
        0
    ) {
        throw new Error(
            "No worksheet was found in the selected file."
        );
    }


    //--------------------------------------------------
    // FIND INVENTORY WORKSHEET
    //--------------------------------------------------

    const inventorySheetName =
        workbook
            .SheetNames
            .find(
                name =>
                    String(name)
                        .trim()
                        .toLowerCase() ===
                    "inventory"
            );


    if (!inventorySheetName) {
        throw new Error(
            'The workbook does not contain a sheet named "Inventory".'
        );
    }


    const worksheet =
        workbook.Sheets[
            inventorySheetName
        ];


    //--------------------------------------------------
    // READ WORKSHEET AS ROWS
    //--------------------------------------------------

    const rawRows =
        XLSX
            .utils
            .sheet_to_json(
                worksheet,
                {
                    header:
                        1,

                    defval:
                        "",

                    raw:
                        false
                }
            );


    //--------------------------------------------------
    // FIND ITEM AND ON HAND HEADER ROW
    //--------------------------------------------------

    const headerRowIndex =
        rawRows.findIndex(
            row => {

                const headings =
                    row.map(
                        value =>
                            normalizeExcelHeading(
                                value
                            )
                    );


                const hasProduct =
                    headings.includes(
                        "item"
                    ) ||

                    headings.includes(
                        "product"
                    ) ||

                    headings.includes(
                        "product name"
                    );


                const hasStock =
                    headings.includes(
                        "on hand"
                    ) ||

                    headings.includes(
                        "stock"
                    ) ||

                    headings.includes(
                        "initial stock"
                    );


                return (
                    hasProduct &&
                    hasStock
                );
            }
        );


    if (
        headerRowIndex ===
        -1
    ) {
        throw new Error(
            "Could not find the ITEM and ON HAND column headings."
        );
    }


    const headings =
        rawRows[
            headerRowIndex
        ]
            .map(
                value =>
                    String(
                        value || ""
                    )
                        .trim()
            );


    //--------------------------------------------------
    // CONVERT PRODUCT ROWS TO OBJECTS
    //--------------------------------------------------

    const productRows =
        rawRows
            .slice(
                headerRowIndex +
                1
            )
            .map(
                row => {

                    const record = {};


                    headings
                        .forEach(
                            (
                                heading,
                                index
                            ) => {

                                if (
                                    !heading
                                ) {
                                    return;
                                }


                                record[
                                    heading
                                ] =
                                    row[
                                        index
                                    ] ??
                                    "";
                            }
                        );


                    return record;
                }
            )
            .filter(
                row => {

                    return Object
                        .values(row)
                        .some(
                            value =>
                                String(
                                    value ||
                                    ""
                                )
                                    .trim() !==
                                ""
                        );
                }
            );


    console.log(
        `Read ${productRows.length} products from the Inventory worksheet.`
    );


    return productRows;
}


//======================================================
// UPDATE CLOUD PRODUCT
//======================================================

async function updateImportedCloudProduct(
    existingProduct,
    importedProduct
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "products"
            )

            .update({

                name:
                    importedProduct.name,

                sku:
                    importedProduct.sku ||
                    null,

                barcode:
                    importedProduct.barcode ||
                    null,

                category:
                    importedProduct.category ||
                    null,

                cost:
                    Number(
                        importedProduct.cost ||
                        0
                    ),

                selling_price:
                    Number(
                        importedProduct
                            .sellingPrice ||
                        0
                    ),

                //--------------------------------------------------
                // EXCEL STOCK REPLACES CURRENT POS STOCK
                //--------------------------------------------------

                stock:
                    Number(
                        importedProduct.stock ||
                        0
                    ),

                low_stock:
                    Number(
                        importedProduct.lowStock ||
                        5
                    )
            })

            .eq(
                "id",
                existingProduct.id
            )

            .select()

            .single();


    if (error) {
        throw new Error(
            `${importedProduct.name}: ${error.message}`
        );
    }


    return data;
}


//======================================================
// INSERT NEW CLOUD PRODUCT
//======================================================

async function insertImportedCloudProduct(
    importedProduct
) {

    const {
        data,
        error
    } =
        await supabaseClient

            .from(
                "products"
            )

            .insert({

                name:
                    importedProduct.name,

                sku:
                    importedProduct.sku ||
                    null,

                barcode:
                    importedProduct.barcode ||
                    null,

                category:
                    importedProduct.category ||
                    null,

                cost:
                    Number(
                        importedProduct.cost ||
                        0
                    ),

                selling_price:
                    Number(
                        importedProduct
                            .sellingPrice ||
                        0
                    ),

                stock:
                    Number(
                        importedProduct.stock ||
                        0
                    ),

                low_stock:
                    Number(
                        importedProduct.lowStock ||
                        5
                    )
            })

            .select()

            .single();


    if (error) {
        throw new Error(
            `${importedProduct.name}: ${error.message}`
        );
    }


    return data;
}


//======================================================
// IMPORT INVENTORY
//======================================================

async function importInventory(
    file
) {

    if (!file) {
        return;
    }


    if (
        typeof supabaseClient ===
        "undefined"
    ) {
        alert(
            "Supabase is not connected."
        );

        return;
    }


    const confirmed =
        confirm(
            "Import this inventory file?\n\n" +

            "Matching products will be updated.\n" +

            "Excel ON HAND stock will REPLACE current POS stock.\n" +

            "Products that do not exist will be added."
        );


    if (!confirmed) {
        return;
    }


    const importButton =
        document.getElementById(
            "inventory-import-btn"
        );


    if (importButton) {
        importButton.disabled =
            true;

        importButton.textContent =
            "Importing...";
    }


    try {

        //--------------------------------------------------
        // CONFIRM ADMIN
        //--------------------------------------------------

        if (
            typeof loadCurrentPOSUser ===
            "function"
        ) {
            await loadCurrentPOSUser(
                true
            );
        }


        if (
            typeof isAdmin ===
            "function" &&

            !isAdmin()
        ) {
            alert(
                "Only an Admin can import inventory."
            );

            return;
        }


        //--------------------------------------------------
        // READ EXCEL
        //--------------------------------------------------

        const rows =
            await readInventorySpreadsheet(
                file
            );


        if (!rows.length) {
            alert(
                "The spreadsheet contains no product rows."
            );

            return;
        }


        //--------------------------------------------------
        // LOAD CLOUD PRODUCTS
        //--------------------------------------------------

        const {
            data:
                cloudRows,

            error:
                cloudError

        } =
            await supabaseClient

                .from(
                    "products"
                )

                .select(
                    "*"
                );


        if (cloudError) {
            throw new Error(
                cloudError.message
            );
        }


        const existingProducts =
            (
                cloudRows ||
                []
            )
                .map(
                    product => ({

                        id:
                            product.id,

                        name:
                            product.name ||
                            "",

                        sku:
                            product.sku ||
                            "",

                        barcode:
                            product.barcode ||
                            "",

                        category:
                            product.category ||
                            "",

                        cost:
                            Number(
                                product.cost ||
                                0
                            ),

                        sellingPrice:
                            Number(
                                product
                                    .selling_price ||
                                0
                            ),

                        stock:
                            Number(
                                product.stock ||
                                0
                            ),

                        lowStock:
                            Number(
                                product.low_stock ||
                                5
                            )
                    })
                );


        //--------------------------------------------------
        // IMPORT COUNTERS
        //--------------------------------------------------

        let updated = 0;

        let added = 0;

        let skipped = 0;

        let failed = 0;


        const errors = [];


        const processedKeys =
            new Set();


        //--------------------------------------------------
        // PROCESS EACH PRODUCT
        //--------------------------------------------------

        for (
            let index = 0;

            index <
            rows.length;

            index++
        ) {

            const mapped =
                mapExcelRowToProduct(
                    rows[index],

                    index +
                    2
                );


            if (
                !mapped.valid
            ) {
                skipped++;


                errors.push(
                    `Row ${mapped.rowNumber}: ${mapped.reason}`
                );


                continue;
            }


            const importedProduct =
                mapped.product;


            const duplicateKey =

                normalizeImportMatchValue(
                    importedProduct.sku
                ) ||

                normalizeImportMatchValue(
                    importedProduct.barcode
                ) ||

                normalizeImportMatchValue(
                    importedProduct.name
                );


            if (
                duplicateKey &&

                processedKeys.has(
                    duplicateKey
                )
            ) {
                skipped++;


                errors.push(
                    `Row ${mapped.rowNumber}: Duplicate product (${importedProduct.name}).`
                );


                continue;
            }


            if (
                duplicateKey
            ) {
                processedKeys.add(
                    duplicateKey
                );
            }


            try {

                const existing =
                    findExistingImportProduct(
                        importedProduct,

                        existingProducts
                    );


                //--------------------------------------------------
                // UPDATE EXISTING PRODUCT
                //--------------------------------------------------

                if (existing) {

                    const saved =
                        await updateImportedCloudProduct(

                            existing,

                            importedProduct
                        );


                    Object.assign(
                        existing,
                        {

                            id:
                                saved.id,

                            name:
                                saved.name ||
                                "",

                            sku:
                                saved.sku ||
                                "",

                            barcode:
                                saved.barcode ||
                                "",

                            category:
                                saved.category ||
                                "",

                            cost:
                                Number(
                                    saved.cost ||
                                    0
                                ),

                            sellingPrice:
                                Number(
                                    saved
                                        .selling_price ||
                                    0
                                ),

                            stock:
                                Number(
                                    saved.stock ||
                                    0
                                ),

                            lowStock:
                                Number(
                                    saved
                                        .low_stock ||
                                    5
                                )
                        }
                    );


                    updated++;
                }


                //--------------------------------------------------
                // ADD NEW PRODUCT
                //--------------------------------------------------

                else {

                    const saved =
                        await insertImportedCloudProduct(
                            importedProduct
                        );


                    existingProducts.push({

                        id:
                            saved.id,

                        name:
                            saved.name ||
                            "",

                        sku:
                            saved.sku ||
                            "",

                        barcode:
                            saved.barcode ||
                            "",

                        category:
                            saved.category ||
                            "",

                        cost:
                            Number(
                                saved.cost ||
                                0
                            ),

                        sellingPrice:
                            Number(
                                saved
                                    .selling_price ||
                                0
                            ),

                        stock:
                            Number(
                                saved.stock ||
                                0
                            ),

                        lowStock:
                            Number(
                                saved
                                    .low_stock ||
                                5
                            )
                    });


                    added++;
                }

            } catch (
                rowError
            ) {

                failed++;


                errors.push(
                    `Row ${mapped.rowNumber}: ${
                        rowError.message ||
                        "Import failed"
                    }`
                );


                console.error(
                    "Inventory import row failed:",

                    mapped,

                    rowError
                );
            }
        }


        //--------------------------------------------------
        // RELOAD INVENTORY FROM CLOUD
        //--------------------------------------------------

        if (
            typeof syncCloudProductsToPOS ===
            "function"
        ) {

            await syncCloudProductsToPOS();

        } else {

            inventory =
                normalizeInventory(
                    existingProducts
                );


            persistInventory();

            renderInventory();
        }


        populateProductSupplierDropdown();


        if (
            typeof populateProductDropdown ===
            "function"
        ) {
            populateProductDropdown();
        }


        if (
            typeof updateDashboardMetrics ===
            "function"
        ) {
            updateDashboardMetrics();
        }


        //--------------------------------------------------
        // IMPORT RESULT
        //--------------------------------------------------

        let message =

            "Inventory import complete.\n\n" +

            `Updated: ${updated}\n` +

            `Added: ${added}\n` +

            `Skipped: ${skipped}\n` +

            `Failed: ${failed}`;


        if (
            errors.length
        ) {

            message +=

                "\n\nFirst issues:\n" +

                errors

                    .slice(
                        0,
                        8
                    )

                    .join(
                        "\n"
                    );
        }


        alert(
            message
        );


        console.log(
            "Inventory import summary:",
            {
                updated,
                added,
                skipped,
                failed,
                errors
            }
        );

    } catch (
        error
    ) {

        console.error(
            "Inventory import failed:",
            error
        );


        alert(
            "Inventory import failed:\n\n" +

            (
                error.message ||
                "Unknown error"
            )
        );

    } finally {

        if (
            importButton
        ) {

            importButton.disabled =
                false;


            importButton.textContent =
                "Import Inventory";
        }


        const input =
            document.getElementById(
                "inventory-import-file"
            );


        if (
            input
        ) {

            input.value =
                "";
        }
    }
}


//======================================================
// CATEGORY DROPDOWN
//======================================================

function populateCategoryDropdown() {
    const select =
        document.getElementById(
            "product-category"
        );


    if (!select) {
        return;
    }


    if (
        typeof getCategories !==
        "function"
    ) {
        return;
    }


    const categories =
        getCategories();


    select.innerHTML = `
        <option value="">

            Select Category

        </option>
    `;


    categories
        .forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.name;


                option.textContent =
                    category.name;


                select.appendChild(
                    option
                );
            }
        );
}


//======================================================
// CATEGORY FILTER
//======================================================

function populateInventoryCategoryFilter() {
    const filter =
        document.getElementById(
            "category-filter"
        );


    if (!filter) {
        return;
    }


    if (
        typeof getCategories !==
        "function"
    ) {
        return;
    }


    const categories =
        getCategories();


    filter.innerHTML = `
        <option value="">

            All Categories

        </option>
    `;


    categories
        .forEach(
            category => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category.name;


                option.textContent =
                    category.name;


                filter.appendChild(
                    option
                );
            }
        );


    if (
        filter.dataset.ready ===
        "true"
    ) {
        return;
    }


    filter.dataset.ready =
        "true";


    filter.addEventListener(
        "change",
        () => {

            renderInventoryByCategory(
                filter.value
            );
        }
    );
}


//======================================================
// RENDER CATEGORY
//======================================================

function renderInventoryByCategory(
    categoryName = ""
) {

    if (
        !categoryName
    ) {

        renderInventory();

        return;
    }


    const filtered =
        inventory.filter(
            product =>

                String(
                    product.category ||
                    ""
                )
                    .toLowerCase() ===

                String(
                    categoryName
                )
                    .toLowerCase()
        );


    const list =
        document.getElementById(
            "inventory-list"
        );


    if (!list) {
        return;
    }


    if (
        !filtered.length
    ) {

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


    const completeInventory =
        inventory;


    inventory =
        filtered;


    renderInventory();


    inventory =
        completeInventory;
}


//======================================================
// INITIALIZE INVENTORY MODULE
//======================================================

function initializeInventoryModule() {

    inventory =
        normalizeInventory(
            Array.isArray(
                inventory
            )
                ? inventory
                : []
        );


    populateProductSupplierDropdown();

    populateCategoryDropdown();

    populateInventoryCategoryFilter();

    renderInventory();

    initializeInventorySearch();


    //--------------------------------------------------
    // PRODUCT FORM
    //--------------------------------------------------

    const form =
        document.getElementById(
            "inventory-form"
        );


    if (
        form &&
        form.dataset.ready !==
        "true"
    ) {

        form.dataset.ready =
            "true";


        form.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                saveProduct();
            }
        );
    }


    //--------------------------------------------------
    // IMPORT BUTTON
    //--------------------------------------------------

    const importButton =
        document.getElementById(
            "inventory-import-btn"
        );


    const importFile =
        document.getElementById(
            "inventory-import-file"
        );


    if (
        importButton &&
        importFile &&

        importButton.dataset.ready !==
        "true"
    ) {

        importButton.dataset.ready =
            "true";


        importButton.addEventListener(
            "click",
            () => {

                importFile.click();
            }
        );


        importFile.addEventListener(
            "change",
            event => {

                importInventory(
                    event.target
                        .files[0]
                );
            }
        );
    }


    //--------------------------------------------------
    // EXPORT BUTTON
    //--------------------------------------------------

    const exportButton =
        document.getElementById(
            "inventory-export-btn"
        );


    if (
        exportButton &&

        exportButton.dataset.ready !==
        "true"
    ) {

        exportButton.dataset.ready =
            "true";


        exportButton.addEventListener(
            "click",
            exportInventory
        );
    }
}


//======================================================
// REFRESH INVENTORY
//======================================================

function refreshInventory() {

    const state =
        loadState();


    inventory =
        normalizeInventory(
            state.inventory ||
            []
        );


    populateProductSupplierDropdown();

    populateCategoryDropdown();

    populateInventoryCategoryFilter();

    renderInventory();
}


//======================================================
// AUTO START
//======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeInventoryModule
);