//======================================================
// TYS POS
// CLOUD SALES MODULE
//======================================================

async function saveSaleToSupabase(sale) {
    console.log("Saving sale to Supabase...", sale);

    const { data: saleData, error: saleError } = await supabaseClient
        .from("sales")
        .insert({
            cashier_id: sale.cashierId || null,
            cashier_name: sale.cashierName || "Admin",
            payment_method: sale.paymentMethod || "Cash",
            subtotal: Number(sale.subtotal || 0),
            discount: Number(sale.discount || 0),
            total: Number(sale.total || 0),
            cost: Number(sale.cost || 0),
            profit: Number(sale.profit || 0)
        })
        .select()
        .single();

    if (saleError) {
        console.error("Sale cloud save failed:", saleError);
        alert("Sale was completed locally but not saved online.");
        return null;
    }

    const saleItems = (sale.items || []).map(item => ({
        sale_id: saleData.id,
        product_id: item.productId || item.id,
        product_name: item.name,
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        cost: Number(item.cost || 0),
        total: Number(item.price || 0) * Number(item.quantity || 0)
    }));

    if (saleItems.length) {
        const { error: itemsError } = await supabaseClient
            .from("sale_items")
            .insert(saleItems);

        if (itemsError) {
            console.error("Sale items cloud save failed:", itemsError);
        }
    }

    for (const item of sale.items || []) {
        const productId = item.productId || item.id;
        const quantity = Number(item.quantity || 0);

        const product = inventory.find(p => p.id === productId);

        if (!product) continue;

        await supabaseClient
            .from("products")
            .update({
                stock: Number(product.stock || 0)
            })
            .eq("id", productId);

        await supabaseClient
            .from("stock_movements")
            .insert({
                product_id: productId,
                product_name: item.name,
                type: "Sale",
                quantity: -quantity,
                notes: `POS sale - ${sale.paymentMethod || "Cash"}`
            });
    }

    console.log("Sale saved online:", saleData);

    return saleData;
}

console.log("cloud-sales.js loaded");