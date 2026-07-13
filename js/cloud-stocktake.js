//======================================================
// TYS POS
// CLOUD STOCKTAKE MODULE
//======================================================

let stocktakeRealtimeChannel = null;
window.lastStocktakeError = null;

function setStocktakeCloudStatus(message, type = "info") {
    const element = document.getElementById("stocktake-cloud-status");
    if (!element) return;

    element.textContent = message;
    element.dataset.status = type;
}

function stocktakeErrorMessage(prefix, error) {
    const message = error?.message || error?.details || error?.hint || "Unknown error";
    const code = error?.code ? ` (${error.code})` : "";
    return `${prefix}: ${message}${code}`;
}

async function confirmStocktakeAdmin() {
    const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

    if (sessionError) {
        throw new Error(stocktakeErrorMessage("Login check failed", sessionError));
    }

    const user = sessionData.session?.user;

    if (!user) {
        throw new Error("No active login session was found.");
    }

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        throw new Error(stocktakeErrorMessage("Profile check failed", profileError));
    }

    if (!profile) {
        throw new Error("No POS profile exists for the logged-in account.");
    }

    if (String(profile.role || "").trim().toLowerCase() !== "admin") {
        throw new Error("Only an Admin can save a stocktake.");
    }

    return {
        userId: user.id,
        name: profile.full_name || user.email || "Admin"
    };
}

async function saveStocktakeToSupabase(stocktake) {
    window.lastStocktakeError = null;

    if (!stocktake || !Array.isArray(stocktake.items) || !stocktake.items.length) {
        const error = new Error("No counted products were supplied.");
        window.lastStocktakeError = error;
        return null;
    }

    if (!navigator.onLine) {
        const error = new Error("This device is offline. Reconnect to the internet and try again.");
        window.lastStocktakeError = error;
        return null;
    }

    setStocktakeCloudStatus("Saving stocktake online…", "saving");

    let headerId = null;

    try {
        const admin = await confirmStocktakeAdmin();

        const { data: header, error: headerError } = await supabaseClient
            .from("stocktakes")
            .insert({
                created_by: admin.userId,
                created_by_name: stocktake.countedBy || admin.name,
                counted_items: Number(stocktake.countedItems || stocktake.items.length),
                shortage_items: Number(stocktake.shortages || 0),
                extra_items: Number(stocktake.extraStock || 0)
            })
            .select("id, created_by, created_by_name, counted_items, shortage_items, extra_items, created_at")
            .single();

        if (headerError) {
            throw new Error(stocktakeErrorMessage("Could not save stocktake header", headerError));
        }

        headerId = header.id;

        const itemRows = stocktake.items.map(item => ({
            stocktake_id: header.id,
            product_id: item.productId,
            product_name: item.productName || "Unknown Product",
            system_stock: Number(item.systemStock || 0),
            physical_stock: Number(item.physicalStock || 0),
            difference: Number(item.difference || 0)
        }));

        const { error: itemsError } = await supabaseClient
            .from("stocktake_items")
            .insert(itemRows);

        if (itemsError) {
            throw new Error(stocktakeErrorMessage("Could not save stocktake items", itemsError));
        }

        for (const item of stocktake.items) {
            const { data: updated, error: productError } = await supabaseClient
                .from("products")
                .update({ stock: Number(item.physicalStock || 0) })
                .eq("id", item.productId)
                .select("id")
                .maybeSingle();

            if (productError) {
                throw new Error(
                    stocktakeErrorMessage(`Could not update ${item.productName}`, productError)
                );
            }

            if (!updated) {
                throw new Error(
                    `No online product matched ${item.productName}. Refresh Products and try again.`
                );
            }
        }

        // Stock movements are useful history, but a movement-table problem must not
        // invalidate an otherwise completed stocktake.
        const movementRows = stocktake.items
            .filter(item => Number(item.difference || 0) !== 0)
            .map(item => ({
                product_id: item.productId,
                product_name: item.productName || "Unknown Product",
                type: "Stocktake",
                quantity: Number(item.difference || 0),
                notes: `Physical count changed stock from ${item.systemStock} to ${item.physicalStock}`
            }));

        if (movementRows.length) {
            const { error: movementError } = await supabaseClient
                .from("stock_movements")
                .insert(movementRows);

            if (movementError) {
                console.warn("Stocktake saved, but stock movement history failed:", movementError);
            }
        }

        setStocktakeCloudStatus("Stocktake saved online.", "success");
        console.log("Stocktake saved online:", header);
        return header;

    } catch (error) {
        window.lastStocktakeError = error;
        console.error("Stocktake cloud save failed:", error);

        // Remove an incomplete header and its items if a later step failed.
        if (headerId) {
            const { error: cleanupError } = await supabaseClient
                .from("stocktakes")
                .delete()
                .eq("id", headerId);

            if (cleanupError) {
                console.warn("Could not remove incomplete stocktake:", cleanupError);
            }
        }

        setStocktakeCloudStatus(error.message || "Stocktake failed.", "error");
        return null;
    }
}

function subscribeToStocktakeChanges() {
    if (stocktakeRealtimeChannel) {
        supabaseClient.removeChannel(stocktakeRealtimeChannel);
    }

    stocktakeRealtimeChannel = supabaseClient
        .channel("tys-stocktake-realtime-v2")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "stocktakes" },
            async () => {
                if (typeof syncCloudProductsToPOS === "function") {
                    await syncCloudProductsToPOS();
                }
            }
        )
        .subscribe(status => {
            console.log("Stocktake realtime:", status);

            if (status === "SUBSCRIBED") {
                setStocktakeCloudStatus("Cloud connection ready.", "success");
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                setStocktakeCloudStatus(
                    "Realtime is unavailable, but normal online saving can still work.",
                    "warning"
                );
            }
        });
}

async function initializeCloudStocktake() {
    if (typeof supabaseClient === "undefined") {
        setStocktakeCloudStatus("Supabase connection is unavailable.", "error");
        return;
    }

    try {
        await confirmStocktakeAdmin();
        setStocktakeCloudStatus("Cloud connection ready.", "success");
        subscribeToStocktakeChanges();
    } catch (error) {
        window.lastStocktakeError = error;
        setStocktakeCloudStatus(error.message, "error");
        console.error("Cloud stocktake initialization failed:", error);
    }
}

document.addEventListener("DOMContentLoaded", initializeCloudStocktake, { once: true });
console.log("cloud-stocktake.js loaded");
