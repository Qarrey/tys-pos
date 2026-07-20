//======================================================
// TYS POS
// CLOUD PRODUCTS + OFFLINE STOCK SYNC
//======================================================

let cloudProductsChannel = null;
let stockSyncRunning = false;

const PENDING_STOCK_KEY =
    "tys-pos-pending-stock-updates";


//======================================================
// OFFLINE QUEUE STORAGE
//======================================================

function getPendingStockUpdates() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(PENDING_STOCK_KEY)
        );

        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.error(
            "Could not read pending stock updates:",
            error
        );
        return [];
    }
}


function savePendingStockUpdates(updates) {
    localStorage.setItem(
        PENDING_STOCK_KEY,
        JSON.stringify(Array.isArray(updates) ? updates : [])
    );

    updateStockSyncStatus();
}


function queueStockUpdate({
    productId,
    productName,
    targetStock,
    quantity,
    reason
}) {
    const updates = getPendingStockUpdates();

    const existingIndex = updates.findIndex(
        update => String(update.productId) === String(productId)
    );

    const previous = existingIndex >= 0
        ? updates[existingIndex]
        : null;

    const record = {
        id: previous?.id ||
            `STOCK-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        productId,
        productName: productName || "Unknown Product",
        targetStock: Number(targetStock || 0),
        quantity:
            Number(previous?.quantity || 0) +
            Number(quantity || 0),
        reason: reason || previous?.reason || "Stock adjustment",
        createdAt: previous?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        updates[existingIndex] = record;
    } else {
        updates.push(record);
    }

    savePendingStockUpdates(updates);

    console.log("Stock update queued:", record);

    return record;
}


//======================================================
// CONNECTION STATUS BADGE
//======================================================

function ensureStockSyncStatusBadge() {
    let badge = document.getElementById("stock-sync-status");

    if (badge) return badge;

    badge = document.createElement("div");
    badge.id = "stock-sync-status";
    badge.style.position = "fixed";
    badge.style.right = "14px";
    badge.style.bottom = "14px";
    badge.style.zIndex = "9999";
    badge.style.padding = "9px 14px";
    badge.style.borderRadius = "999px";
    badge.style.fontFamily = "Arial, sans-serif";
    badge.style.fontSize = "13px";
    badge.style.fontWeight = "700";
    badge.style.boxShadow = "0 4px 15px rgba(0,0,0,0.18)";

    document.body.appendChild(badge);
    return badge;
}


function updateStockSyncStatus(customMessage = "") {
    if (!document.body) return;

    const badge = ensureStockSyncStatusBadge();
    const pending = getPendingStockUpdates().length;

    if (customMessage) {
        badge.textContent = customMessage;
        badge.style.background = "#f59e0b";
        badge.style.color = "#111827";
        return;
    }

    if (!navigator.onLine) {
        badge.textContent = pending
            ? `Offline • ${pending} pending`
            : "Offline";
        badge.style.background = "#dc2626";
        badge.style.color = "#ffffff";
        return;
    }

    if (stockSyncRunning) {
        badge.textContent = `Syncing ${pending} update(s)...`;
        badge.style.background = "#f59e0b";
        badge.style.color = "#111827";
        return;
    }

    if (pending) {
        badge.textContent = `Online • ${pending} pending`;
        badge.style.background = "#f59e0b";
        badge.style.color = "#111827";
        return;
    }

    badge.textContent = "Online • Synced";
    badge.style.background = "#16a34a";
    badge.style.color = "#ffffff";
}


//======================================================
// PRODUCT MAPPING
//======================================================

function mapCloudProduct(product) {
    return {
        id: product.id,
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category: product.category || "",
        cost: Number(product.cost || 0),
        sellingPrice: Number(product.selling_price || 0),
        stock: Number(product.stock || 0),
        lowStock: Number(product.low_stock || 5)
    };
}


//======================================================
// LOAD AND SYNC PRODUCTS
//======================================================

async function loadCloudProducts() {
    if (!navigator.onLine) {
        return Array.isArray(window.inventory)
            ? window.inventory
            : [];
    }

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw error;

    return (data || []).map(mapCloudProduct);
}


async function syncCloudProductsToPOS() {
    if (!navigator.onLine) {
        updateStockSyncStatus();
        return Array.isArray(window.inventory)
            ? window.inventory
            : [];
    }

    try {
        const cloudProducts = await loadCloudProducts();

        console.log(
            `Loaded ${cloudProducts.length} products from Supabase.`
        );

        window.inventory = cloudProducts;

        try {
            inventory = cloudProducts;
        } catch (_) {
            // Older pages may not expose the legacy global variable.
        }

        const currentState = typeof loadState === "function"
            ? loadState()
            : {};

        if (typeof saveState === "function") {
            saveState({
                ...currentState,
                inventory: cloudProducts
            });
        }

        if (typeof renderProducts === "function") renderProducts();
        if (typeof renderInventory === "function") renderInventory();
        if (typeof populateProductDropdown === "function") {
            populateProductDropdown();
        }
        if (typeof updateDashboardMetrics === "function") {
            updateDashboardMetrics();
        }

        updateStockSyncStatus();
        return cloudProducts;
    } catch (error) {
        console.error("Cloud product sync failed:", error);
        updateStockSyncStatus("Cloud unavailable");

        return Array.isArray(window.inventory)
            ? window.inventory
            : [];
    }
}


//======================================================
// SAVE OR UPDATE PRODUCT ONLINE
//======================================================

async function saveProductToSupabase(product) {
    if (!product) return null;

    if (!navigator.onLine) {
        alert(
            "Product editing requires internet. Stock adjustments can still be saved offline."
        );
        return null;
    }

    const productData = {
        name: product.name || "",
        sku: product.sku || null,
        barcode: product.barcode || null,
        category: product.category || null,
        cost: Number(product.cost || 0),
        selling_price: Number(product.sellingPrice || 0),
        stock: Number(product.stock || 0),
        low_stock: Number(product.lowStock || 5)
    };

    let query;

    if (product.id && !String(product.id).startsWith("P-")) {
        query = supabaseClient
            .from("products")
            .update(productData)
            .eq("id", product.id);
    } else {
        query = supabaseClient
            .from("products")
            .insert(productData);
    }

    const { data, error } = await query.select().single();

    if (error) {
        console.error("Could not save product online:", error);
        alert(`Product was not saved online: ${error.message}`);
        return null;
    }

    return mapCloudProduct(data);
}


//======================================================
// UPDATE STOCK ONLINE OR QUEUE FOR LATER
//======================================================

async function updateProductStockInSupabase(
    productId,
    newStock,
    options = {}
) {
    const productName = options.productName || "Unknown Product";
    const quantity = Number(options.quantity || 0);
    const reason = options.reason || "Stock adjustment";

    if (!navigator.onLine) {
        queueStockUpdate({
            productId,
            productName,
            targetStock: Number(newStock),
            quantity,
            reason
        });

        return {
            queued: true,
            stock: Number(newStock)
        };
    }

    try {
        const { data, error } = await supabaseClient
            .from("products")
            .update({ stock: Number(newStock) })
            .eq("id", productId)
            .select()
            .single();

        if (error) throw error;

        return {
            queued: false,
            stock: Number(data.stock),
            product: mapCloudProduct(data)
        };
    } catch (error) {
        console.error(
            "Stock online update failed; queued for later:",
            error
        );

        queueStockUpdate({
            productId,
            productName,
            targetStock: Number(newStock),
            quantity,
            reason
        });

        return {
            queued: true,
            stock: Number(newStock),
            error
        };
    }
}


//======================================================
// SYNC PENDING STOCK UPDATES
//======================================================

async function syncPendingStockUpdates() {
    if (stockSyncRunning || !navigator.onLine) {
        updateStockSyncStatus();
        return;
    }

    const pending = getPendingStockUpdates();

    if (!pending.length) {
        updateStockSyncStatus();
        return;
    }

    if (typeof supabaseClient === "undefined") return;

    stockSyncRunning = true;
    updateStockSyncStatus();

    const remaining = [];

    try {
        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError || !sessionData.session) {
            console.warn(
                "Pending stock cannot sync until the user is logged in."
            );
            savePendingStockUpdates(pending);
            return;
        }

        for (const update of pending) {
            try {
                const { data, error } = await supabaseClient
                    .from("products")
                    .update({ stock: Number(update.targetStock) })
                    .eq("id", update.productId)
                    .select("id, stock")
                    .single();

                if (error) throw error;

                console.log(
                    `Synced stock for ${update.productName}:`,
                    data.stock
                );

                if (Number(update.quantity || 0) !== 0) {
                    const { error: movementError } = await supabaseClient
                        .from("stock_movements")
                        .insert({
                            product_id: update.productId,
                            product_name: update.productName,
                            type: Number(update.quantity) > 0
                                ? "Stock In"
                                : "Stock Out",
                            quantity: Number(update.quantity),
                            notes: `${update.reason} (offline sync)`
                        });

                    if (movementError) {
                        console.warn(
                            "Stock synced, but movement record failed:",
                            movementError
                        );
                    }
                }
            } catch (error) {
                console.error(
                    `Could not sync ${update.productName}:`,
                    error
                );
                remaining.push(update);
            }
        }

        savePendingStockUpdates(remaining);

        if (!remaining.length) {
            await syncCloudProductsToPOS();
            console.log(
                "All pending stock updates synchronized."
            );
        }
    } finally {
        stockSyncRunning = false;
        updateStockSyncStatus();
    }
}


//======================================================
// DELETE PRODUCT ONLINE
//======================================================

async function deleteProductFromSupabase(productId) {
    if (!navigator.onLine) {
        alert("Deleting products requires an internet connection.");
        return false;
    }

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", productId);

    if (error) {
        console.error("Could not delete product online:", error);
        alert(`Product was not deleted online: ${error.message}`);
        return false;
    }

    return true;
}


//======================================================
// REALTIME PRODUCT UPDATES
//======================================================

function subscribeToCloudProducts() {
    if (!navigator.onLine) return;

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
                console.log(
                    "Product change received:",
                    payload.eventType
                );

                if (getPendingStockUpdates().length === 0) {
                    await syncCloudProductsToPOS();
                }
            }
        )
        .subscribe(status => {
            console.log("Products realtime:", status);
        });
}


//======================================================
// INITIALIZE
//======================================================

async function initializeCloudProducts() {
    updateStockSyncStatus();

    if (typeof supabaseClient === "undefined") return;

    if (!navigator.onLine) {
        console.log("Offline: using locally saved products.");
        return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error || !data.session) {
        console.warn("No logged-in session. Cloud products not loaded.");
        return;
    }

    await syncPendingStockUpdates();

    if (getPendingStockUpdates().length === 0) {
        await syncCloudProductsToPOS();
    }

    subscribeToCloudProducts();
}


//======================================================
// NETWORK EVENTS
//======================================================

window.addEventListener("online", async () => {
    console.log(
        "Internet restored. Synchronizing pending stock..."
    );
    updateStockSyncStatus();
    await syncPendingStockUpdates();
    subscribeToCloudProducts();
});


window.addEventListener("offline", () => {
    console.log(
        "Internet disconnected. Stock changes will be queued."
    );
    updateStockSyncStatus();
});


document.addEventListener(
    "DOMContentLoaded",
    initializeCloudProducts
);

console.log("cloud-products.js loaded");
