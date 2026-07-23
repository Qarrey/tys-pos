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