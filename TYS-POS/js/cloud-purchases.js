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
                    cost: Number(product.cost || purchase.cost || 0),
                    selling_price: Number(product.sellingPrice || product.price || 0)
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
// UPDATE PURCHASE IN SUPABASE
//------------------------------------------------------

async function updatePurchaseInSupabase(oldPurchase, newPurchase) {
    if (!oldPurchase || !newPurchase) return null;

    const { data: purchaseData, error: purchaseError } = await supabaseClient
        .from("purchases")
        .update({
            supplier_id: newPurchase.supplierId || null,
            supplier_name: newPurchase.supplierName || "Not specified",
            product_id: newPurchase.productId || null,
            product_name: newPurchase.productName || "Unknown Product",
            quantity: Number(newPurchase.quantity || 0),
            cost: Number(newPurchase.cost || 0),
            total: Number(newPurchase.total || 0),
            invoice: newPurchase.invoice || null,
            created_at: newPurchase.date || new Date().toISOString()
        })
        .eq("id", oldPurchase.id)
        .select()
        .maybeSingle();

    if (purchaseError) {
        console.error("Could not update purchase in Supabase:", purchaseError);
        throw purchaseError;
    }

    const state = typeof loadState === "function" ? loadState() : {};
    const inventory = state.inventory || [];
    const affectedIds = [...new Set([oldPurchase.productId, newPurchase.productId].filter(Boolean))];

    for (const productId of affectedIds) {
        const product = inventory.find(item => String(item.id) === String(productId));
        if (!product) continue;

        const { error: productError } = await supabaseClient
            .from("products")
            .update({
                stock: Number(product.stock || 0),
                cost: Number(product.cost || 0),
                selling_price: Number(product.sellingPrice || product.price || 0)
            })
            .eq("id", productId);

        if (productError) {
            console.error("Could not update corrected product stock:", productError);
        }
    }

    const sameProduct = String(oldPurchase.productId) === String(newPurchase.productId);
    const quantityChange = sameProduct
        ? Number(newPurchase.quantity || 0) - Number(oldPurchase.quantity || 0)
        : Number(newPurchase.quantity || 0);

    const notes = sameProduct
        ? `Purchase corrected: quantity ${oldPurchase.quantity} to ${newPurchase.quantity}; cost ${oldPurchase.cost} to ${newPurchase.cost}`
        : `Purchase corrected: product changed from ${oldPurchase.productName} to ${newPurchase.productName}; old quantity ${oldPurchase.quantity}, new quantity ${newPurchase.quantity}`;

    const movementRows = [];
    if (!sameProduct) {
        movementRows.push({
            product_id: oldPurchase.productId || null,
            product_name: oldPurchase.productName || "Unknown Product",
            type: "Purchase correction",
            quantity: -Number(oldPurchase.quantity || 0),
            notes
        });
    }

    movementRows.push({
        product_id: newPurchase.productId || null,
        product_name: newPurchase.productName || "Unknown Product",
        type: "Purchase correction",
        quantity: quantityChange,
        notes
    });

    const { error: movementError } = await supabaseClient
        .from("stock_movements")
        .insert(movementRows);

    if (movementError) {
        console.error("Could not save purchase correction movement:", movementError);
    }

    return purchaseData;
}


//------------------------------------------------------
// DELETE PURCHASE FROM SUPABASE
//------------------------------------------------------

async function deletePurchaseFromSupabase(purchase) {
    if (!purchase) return false;

    const purchaseId = String(purchase.cloudId || purchase.id || "").trim();

    if (!purchaseId) {
        throw new Error("Purchase ID is missing.");
    }

    const { error: purchaseError } = await supabaseClient
        .from("purchases")
        .delete()
        .eq("id", purchaseId);

    if (purchaseError) {
        console.error("Could not delete purchase from Supabase:", purchaseError);
        throw purchaseError;
    }

    const state = typeof loadState === "function" ? loadState() : {};
    const inventory = state.inventory || [];
    const product = inventory.find(item =>
        String(item.id).trim() === String(purchase.productId || "").trim()
    );

    if (product) {
        const { error: productError } = await supabaseClient
            .from("products")
            .update({ stock: Number(product.stock || 0) })
            .eq("id", purchase.productId);

        if (productError) {
            console.error("Could not update product stock after purchase deletion:", productError);
        }
    }

    const { error: movementError } = await supabaseClient
        .from("stock_movements")
        .insert({
            product_id: purchase.productId || null,
            product_name: purchase.productName || "Unknown Product",
            type: "Purchase deletion",
            quantity: -Number(purchase.quantity || 0),
            notes: `Deleted purchase${purchase.invoice ? ` invoice ${purchase.invoice}` : ""}`
        });

    if (movementError) {
        console.error("Could not save purchase deletion movement:", movementError);
    }

    return true;
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