//======================================================
// TYS POS
// CLOUD SALES MODULE
//======================================================

let cloudSalesChannel = null;

//------------------------------------------------------
// SAVE SALE TO SUPABASE
//------------------------------------------------------

async function saveSaleToSupabase(sale) {
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
            profit: Number(sale.profit || 0),
            sale_date: sale.date || new Date().toISOString()
        })
        .select()
        .single();

    if (saleError) {
        console.error("Could not save cloud sale:", saleError);
        alert("Sale completed locally but was not saved online.");
        return null;
    }

    const saleItems = (sale.items || []).map(item => ({
        sale_id: saleData.id,
        product_id: item.productId || item.id || null,
        product_name: item.name || "Unknown Product",
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        cost: Number(item.cost || 0),
        total:
            Number(item.price || 0) *
            Number(item.quantity || 0)
    }));

    if (saleItems.length) {
        const { error: itemsError } = await supabaseClient
            .from("sale_items")
            .insert(saleItems);

        if (itemsError) {
            console.error("Could not save cloud sale items:", itemsError);
        }
    }

    for (const item of sale.items || []) {
        const productId = item.productId || item.id;

        if (!productId) continue;

        const product = inventory.find(product => {
            return product.id === productId;
        });

        if (!product) continue;

        const { error: stockError } = await supabaseClient
            .from("products")
            .update({
                stock: Number(product.stock || 0)
            })
            .eq("id", productId);

        if (stockError) {
            console.error("Could not update cloud stock:", stockError);
        }

        const { error: movementError } = await supabaseClient
            .from("stock_movements")
            .insert({
                product_id: productId,
                product_name: item.name || product.name,
                type: "Sale",
                quantity: -Number(item.quantity || 0),
                notes: `POS sale - ${sale.paymentMethod || "Cash"}`
            });

        if (movementError) {
            console.error(
                "Could not save cloud stock movement:",
                movementError
            );
        }
    }

    await syncCloudSalesToPOS();

    return saleData;
}

//------------------------------------------------------
// LOAD SALES FROM SUPABASE
//------------------------------------------------------

async function loadCloudSales() {
    const { data, error } = await supabaseClient
        .from("sales")
        .select(`
            id,
            cashier_id,
            cashier_name,
            payment_method,
            subtotal,
            discount,
            total,
            cost,
            profit,
            sale_date,
            created_at,
            sale_items (
                id,
                product_id,
                product_name,
                quantity,
                price,
                cost,
                total
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud sales:", error);
        return [];
    }

    return (data || []).map(sale => ({
        id: sale.id,
        date: sale.sale_date || sale.created_at,

        cashierId: sale.cashier_id || "",
        cashierName: sale.cashier_name || "Admin",

        paymentMethod: sale.payment_method || "Cash",

        subtotal: Number(sale.subtotal || 0),
        discount: Number(sale.discount || 0),
        total: Number(sale.total || 0),
        cost: Number(sale.cost || 0),
        profit: Number(sale.profit || 0),

        items: (sale.sale_items || []).map(item => ({
            id: item.product_id || item.id,
            productId: item.product_id || "",
            name: item.product_name || "Unknown Product",
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            cost: Number(item.cost || 0),
            total: Number(item.total || 0)
        }))
    }));
}

//------------------------------------------------------
// COPY CLOUD SALES INTO THE POS
//------------------------------------------------------

async function syncCloudSalesToPOS() {
    try {
        const cloudSales = await loadCloudSales();

        console.log(
            `Loaded ${cloudSales.length} sales from Supabase.`
        );

        sales = cloudSales;

        const state =
            typeof loadState === "function"
                ? loadState()
                : {};

        if (typeof saveState === "function") {
            saveState({
                ...state,
                sales: cloudSales
            });
        }

        refreshSalesPages();

        return cloudSales;

    } catch (error) {
        console.error("Cloud sales synchronization failed:", error);
        return [];
    }
}

//------------------------------------------------------
// REFRESH CURRENT PAGE
//------------------------------------------------------

function refreshSalesPages() {
    if (typeof renderSales === "function") {
        renderSales();
    }

    if (typeof renderBestSellers === "function") {
        renderBestSellers();
    }

    if (typeof renderDailySummary === "function") {
        renderDailySummary();
    }

    if (typeof renderMonthlySummary === "function") {
        renderMonthlySummary();
    }

    if (typeof renderYearlySummary === "function") {
        renderYearlySummary();
    }

    if (typeof renderReports === "function") {
        renderReports();
    }

    if (typeof renderProfit === "function") {
        renderProfit();
    }

    if (typeof updateDashboardMetrics === "function") {
        updateDashboardMetrics();
    }
}

//------------------------------------------------------
// REALTIME SALES
//------------------------------------------------------

function subscribeToCloudSales() {
    if (cloudSalesChannel) {
        supabaseClient.removeChannel(cloudSalesChannel);
    }

    cloudSalesChannel = supabaseClient
        .channel("tys-sales-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "sales"
            },
            async payload => {
                console.log(
                    "Realtime sale change:",
                    payload.eventType
                );

                await syncCloudSalesToPOS();
            }
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "sale_items"
            },
            async () => {
                await syncCloudSalesToPOS();
            }
        )
        .subscribe(status => {
            console.log("Sales realtime:", status);
        });
}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

async function initializeCloudSales() {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        console.warn("No session. Cloud sales were not loaded.");
        return;
    }

    await syncCloudSalesToPOS();

    subscribeToCloudSales();
}

document.addEventListener(
    "DOMContentLoaded",
    initializeCloudSales
);

console.log("cloud-sales.js loaded");