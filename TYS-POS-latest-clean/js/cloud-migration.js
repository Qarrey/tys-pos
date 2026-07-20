async function uploadLocalProductsToSupabase() {
    const localProducts = loadState().inventory || [];

    if (!localProducts.length) {
        alert("No local products found to upload.");
        return;
    }

    if (!confirm(`Upload ${localProducts.length} products to Supabase?`)) {
        return;
    }

    const products = localProducts.map(product => ({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        cost: Number(product.cost || 0),
        selling_price: Number(product.sellingPrice || product.price || 0),
        stock: Number(product.stock || 0),
        low_stock: Number(product.lowStock || 5)
    }));

    const { error } = await supabaseClient
        .from("products")
        .insert(products);

    if (error) {
        console.error(error);
        alert("Upload failed. Check Console.");
        return;
    }

    alert("Products uploaded to Supabase successfully.");
}