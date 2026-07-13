//======================================================
// TYS POS
// CLOUD PRODUCTS MODULE
//======================================================

let cloudProductsChannel = null;

//------------------------------------------------------
// LOAD PRODUCTS FROM SUPABASE
//------------------------------------------------------

async function loadCloudProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Could not load cloud products:", error);
        return [];
    }

    return (data || []).map(product => ({
        id: product.id,
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        cost: Number(product.cost || 0),
        sellingPrice: Number(product.selling_price || 0),
        stock: Number(product.stock || 0),
        lowStock: Number(product.low_stock || 5)
    }));
}

//------------------------------------------------------
// SYNC CLOUD PRODUCTS INTO POS
//------------------------------------------------------

async function syncCloudProductsToPOS() {
    try {
        const cloudProducts = await loadCloudProducts();

        console.log(
            `Loaded ${cloudProducts.length} products from Supabase.`
        );

        window.inventory = cloudProducts;

        const currentState =
            typeof loadState === "function"
                ? loadState()
                : {};

        if (typeof saveState === "function") {
            saveState({
                ...currentState,
                inventory: cloudProducts
            });
        }

        if (typeof renderProducts === "function") {
            renderProducts();
        }

        if (typeof renderInventory === "function") {
            renderInventory();
        }

        if (typeof populateProductDropdown === "function") {
            populateProductDropdown();
        }

        if (typeof updateDashboardMetrics === "function") {
            updateDashboardMetrics();
        }

        return cloudProducts;

    } catch (error) {
        console.error("Cloud product sync failed:", error);
        return [];
    }
}

//------------------------------------------------------
// REALTIME PRODUCT UPDATES
//------------------------------------------------------

function subscribeToCloudProducts() {
    if (cloudProductsChannel) {
        supabaseClient.removeChannel(cloudProductsChannel);
    }

    cloudProductsChannel = supabaseClient
        .channel("tys-products-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "products"
            },
            async payload => {
                console.log("Product change received:", payload.eventType);

                await syncCloudProductsToPOS();
            }
        )
        .subscribe(status => {
            console.log("Products realtime:", status);
        });
}

//======================================================
// SAVE OR UPDATE PRODUCT ONLINE
//======================================================

async function saveProductToSupabase(product) {
    if (!product) {
        return null;
    }

    const productData = {
        name:
            product.name || "",

        sku:
            product.sku || null,

        barcode:
            product.barcode || null,

        category:
            product.category || null,

        cost:
            Number(
                product.cost || 0
            ),

        selling_price:
            Number(
                product.sellingPrice || 0
            ),

        stock:
            Number(
                product.stock || 0
            ),

        low_stock:
            Number(
                product.lowStock || 5
            )
    };

    let query;

    if (
        product.id &&
        !String(product.id).startsWith("P-")
    ) {
        query =
            supabaseClient
                .from("products")
                .update(productData)
                .eq(
                    "id",
                    product.id
                );
    } else {
        query =
            supabaseClient
                .from("products")
                .insert(productData);
    }

    const {
        data,
        error
    } = await query
        .select()
        .single();

    if (error) {
        console.error(
            "Could not save product online:",
            error
        );

        alert(
            `Product was not saved online: ${
                error.message
            }`
        );

        return null;
    }

    return data;
}


//======================================================
// UPDATE PRODUCT STOCK ONLINE
//======================================================

async function updateProductStockInSupabase(
    productId,
    newStock
) {
    if (
        typeof supabaseClient ===
        "undefined"
    ) {
        console.error(
            "Supabase client is unavailable."
        );

        return null;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .update({
                stock:
                    Number(newStock)
            })
            .eq(
                "id",
                productId
            )
            .select()
            .single();

    if (error) {
        console.error(
            "Could not update stock online:",
            error
        );

        alert(
            `Stock was not updated online: ${
                error.message
            }`
        );

        return null;
    }

    return data;
}


//======================================================
// DELETE PRODUCT ONLINE
//======================================================

async function deleteProductFromSupabase(
    productId
) {
    if (
        typeof supabaseClient ===
        "undefined"
    ) {
        return false;
    }

    const {
        error
    } =
        await supabaseClient
            .from("products")
            .delete()
            .eq(
                "id",
                productId
            );

    if (error) {
        console.error(
            "Could not delete product online:",
            error
        );

        alert(
            `Product was not deleted online: ${
                error.message
            }`
        );

        return false;
    }

    return true;
}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

async function initializeCloudProducts() {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        console.warn("No logged-in session. Cloud products not loaded.");
        return;
    }

    await syncCloudProductsToPOS();

    subscribeToCloudProducts();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeCloudProducts
);

console.log("cloud-products.js loaded");