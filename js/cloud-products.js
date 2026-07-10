//======================================================
// TYS POS
// CLOUD PRODUCTS MODULE
//======================================================

async function loadCloudProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud products:", error);
        return [];
    }

    return data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku || "",
        category: product.category || "",
        cost: Number(product.cost || 0),
        sellingPrice: Number(product.selling_price || 0),
        stock: Number(product.stock || 0),
        lowStock: Number(product.low_stock || 5)
    }));
}

async function syncCloudProductsToPOS() {
    if (typeof supabaseClient === "undefined") return;

    const cloudProducts = await loadCloudProducts();

    inventory = cloudProducts;

    saveState({
        inventory,
        sales
    });

    if (typeof renderProducts === "function") {
        renderProducts();
    }

    if (typeof renderInventory === "function") {
        renderInventory();
    }

    if (typeof populateProductDropdown === "function") {
        populateProductDropdown();
    }
}

function subscribeToCloudProducts() {
    supabaseClient
        .channel("products-changes")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "products"
            },
            async () => {
                await syncCloudProductsToPOS();
            }
        )
        .subscribe();
}

document.addEventListener("DOMContentLoaded", async () => {
    await syncCloudProductsToPOS();
    subscribeToCloudProducts();
});