//======================================================
// TYS POS
// CLOUD PURCHASES MODULE
//======================================================

let cloudPurchasesChannel = null;


//------------------------------------------------------
// SAVE PURCHASE TO SUPABASE
//------------------------------------------------------

async function savePurchaseToSupabase(purchase) {
    if (!purchase) {
        console.error("No purchase supplied.");
        return null;
    }

    const supplierId =
        purchase.supplierId || null;

    const { data: purchaseData, error: purchaseError } =
        await supabaseClient
            .from("purchases")
            .insert({
                supplier_id: supplierId,
                supplier_name:
                    purchase.supplierName || "Not specified",

                product_id:
                    purchase.productId || null,

                product_name:
                    purchase.productName || "Unknown Product",

                quantity:
                    Number(purchase.quantity || 0),

                cost:
                    Number(purchase.cost || 0),

                total:
                    Number(purchase.total || 0),

                invoice:
                    purchase.invoice || null,

                created_at:
                    purchase.date || new Date().toISOString()
            })
            .select()
            .single();

    if (purchaseError) {
        console.error(
            "Could not save purchase to Supabase:",
            purchaseError
        );

        alert(
            "Purchase was saved on this device but not saved online."
        );

        return null;
    }


    //--------------------------------------------------
    // UPDATE CLOUD PRODUCT STOCK
    //--------------------------------------------------

    const state =
        typeof loadState === "function"
            ? loadState()
            : {};

    const inventory =
        state.inventory || [];

    const product =
        inventory.find(item => {
            return String(item.id) ===
                String(purchase.productId);
        });

    if (product) {
        const { error: productError } =
            await supabaseClient
                .from("products")
                .update({
                    stock: Number(product.stock || 0),
                    cost: Number(product.cost || purchase.cost || 0)
                })
                .eq("id", purchase.productId);

        if (productError) {
            console.error(
                "Could not update cloud product stock:",
                productError
            );
        }
    }


    //--------------------------------------------------
    // SAVE CLOUD STOCK MOVEMENT
    //--------------------------------------------------

    const { error: movementError } =
        await supabaseClient
            .from("stock_movements")
            .insert({
                product_id:
                    purchase.productId || null,

                product_name:
                    purchase.productName || "Unknown Product",

                type:
                    "Purchase",

                quantity:
                    Number(purchase.quantity || 0),

                notes:
                    purchase.invoice
                        ? `Purchase invoice: ${purchase.invoice}`
                        : "Purchase recorded"
            });

    if (movementError) {
        console.error(
            "Could not save purchase stock movement:",
            movementError
        );
    }

    console.log(
        "Purchase saved to Supabase:",
        purchaseData
    );

    return purchaseData;
}


//------------------------------------------------------
// LOAD PURCHASES FROM SUPABASE
//------------------------------------------------------

async function loadCloudPurchases() {
    const { data, error } =
        await supabaseClient
            .from("purchases")
            .select("*")
            .order("created_at", {
                ascending: false
            });

    if (error) {
        console.error(
            "Could not load cloud purchases:",
            error
        );

        return [];
    }

    return (data || []).map(purchase => ({
        id:
            purchase.id,

        supplierId:
            purchase.supplier_id || "",

        supplierName:
            purchase.supplier_name || "Not specified",

        productId:
            purchase.product_id || "",

        productName:
            purchase.product_name || "Unknown Product",

        quantity:
            Number(purchase.quantity || 0),

        cost:
            Number(purchase.cost || 0),

        total:
            Number(purchase.total || 0),

        invoice:
            purchase.invoice || "",

        date:
            purchase.created_at
    }));
}


//------------------------------------------------------
// COPY CLOUD PURCHASES INTO POS
//------------------------------------------------------

async function syncCloudPurchasesToPOS() {
    try {
        const cloudPurchases =
            await loadCloudPurchases();

        console.log(
            `Loaded ${cloudPurchases.length} purchases from Supabase.`
        );

        purchases = cloudPurchases;

        if (typeof savePurchases === "function") {
            savePurchases(cloudPurchases);
        }

        if (typeof renderPurchaseHistory === "function") {
            renderPurchaseHistory();
        }

        if (typeof updatePurchaseSummary === "function") {
            updatePurchaseSummary();
        }

        if (typeof updateDashboardMetrics === "function") {
            updateDashboardMetrics();
        }

        return cloudPurchases;

    } catch (error) {
        console.error(
            "Cloud purchase synchronization failed:",
            error
        );

        return [];
    }
}


//------------------------------------------------------
// REALTIME PURCHASE UPDATES
//------------------------------------------------------

function subscribeToCloudPurchases() {
    if (cloudPurchasesChannel) {
        supabaseClient.removeChannel(
            cloudPurchasesChannel
        );
    }

    cloudPurchasesChannel =
        supabaseClient
            .channel("tys-purchases-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "purchases"
                },
                async payload => {
                    console.log(
                        "Purchase change received:",
                        payload.eventType
                    );

                    await syncCloudPurchasesToPOS();
                }
            )
            .subscribe(status => {
                console.log(
                    "Purchases realtime:",
                    status
                );
            });
}


//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

async function initializeCloudPurchases() {
    const { data } =
        await supabaseClient.auth.getSession();

    if (!data.session) {
        console.warn(
            "No logged-in session. Cloud purchases were not loaded."
        );

        return;
    }

    await syncCloudPurchasesToPOS();

    subscribeToCloudPurchases();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeCloudPurchases
);


console.log("cloud-purchases.js loaded");