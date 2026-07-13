//======================================================
// TYS POS
// CLOUD STOCKTAKE MODULE
//======================================================

const STOCKTAKE_REQUEST_TIMEOUT_MS = 30000;

function withStocktakeTimeout(promise, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            window.setTimeout(() => {
                reject(new Error(`${label} timed out. Check your internet connection and try again.`));
            }, STOCKTAKE_REQUEST_TIMEOUT_MS);
        })
    ]);
}

function setStocktakeCloudStatus(message, type = "info") {
    const element = document.getElementById("stocktake-cloud-status");
    if (!element) return;

    element.textContent = message;
    element.dataset.status = type;
    element.hidden = false;
}

async function confirmStocktakeSession() {
    if (typeof supabaseClient === "undefined") {
        throw new Error("Supabase is not connected.");
    }

    const { data, error } = await withStocktakeTimeout(
        supabaseClient.auth.getSession(),
        "Login check"
    );

    if (error) throw error;
    if (!data.session?.user) {
        throw new Error("Your login session has expired. Please log in again.");
    }

    return data.session.user;
}

async function insertStocktakeHeader(stocktake, userId) {
    const { data, error } = await withStocktakeTimeout(
        supabaseClient
            .from("stocktakes")
            .insert({
                created_by: userId,
                created_by_name: stocktake.countedBy || "Admin",
                counted_items: Number(stocktake.countedItems || 0),
                shortage_items: Number(stocktake.shortages || 0),
                extra_items: Number(stocktake.extraStock || 0)
            })
            .select("id, created_by, created_by_name, counted_items, shortage_items, extra_items, created_at")
            .single(),
        "Saving stocktake header"
    );

    if (error) {
        throw new Error(`Could not save stocktake header: ${error.message}`);
    }

    return data;
}

async function insertStocktakeItems(headerId, items) {
    const rows = items.map(item => ({
        stocktake_id: headerId,
        product_id: item.productId,
        product_name: item.productName || "Unknown Product",
        system_stock: Number(item.systemStock || 0),
        physical_stock: Number(item.physicalStock || 0),
        difference: Number(item.difference || 0)
    }));

    const { error } = await withStocktakeTimeout(
        supabaseClient.from("stocktake_items").insert(rows),
        "Saving stocktake items"
    );

    if (error) {
        throw new Error(`Could not save stocktake items: ${error.message}`);
    }

    return rows;
}

async function updateStocktakeProduct(item) {
    const { data, error } = await withStocktakeTimeout(
        supabaseClient
            .from("products")
            .update({ stock: Number(item.physicalStock || 0) })
            .eq("id", item.productId)
            .select("id, name, stock"),
        `Updating ${item.productName}`
    );

    if (error) {
        throw new Error(`Could not update ${item.productName}: ${error.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No cloud product matched ${item.productName}.`);
    }

    return data[0];
}

async function saveCloudStockMovement(item) {
    if (Number(item.difference || 0) === 0) return;

    const { error } = await supabaseClient
        .from("stock_movements")
        .insert({
            product_id: item.productId,
            product_name: item.productName || "Unknown Product",
            type: "Stocktake",
            quantity: Number(item.difference || 0),
            notes: `Physical count changed stock from ${item.systemStock} to ${item.physicalStock}`
        });

    // A stock movement is useful history, but it must not undo a completed stocktake.
    if (error) {
        console.warn("Stock movement history was not saved:", error);
    }
}

async function removeIncompleteStocktake(headerId) {
    if (!headerId) return;

    const { error } = await supabaseClient
        .from("stocktakes")
        .delete()
        .eq("id", headerId);

    if (error) {
        console.warn("Could not remove incomplete stocktake header:", error);
    }
}

async function saveStocktakeToSupabase(stocktake) {
    if (!stocktake || !Array.isArray(stocktake.items) || stocktake.items.length === 0) {
        setStocktakeCloudStatus("No counted products were supplied.", "error");
        return null;
    }

    if (!navigator.onLine) {
        setStocktakeCloudStatus("You are offline. Reconnect before saving this stocktake.", "error");
        return null;
    }

    let header = null;

    try {
        setStocktakeCloudStatus("Checking login and cloud connection…", "working");
        const user = await confirmStocktakeSession();

        setStocktakeCloudStatus("Saving stocktake summary…", "working");
        header = await insertStocktakeHeader(stocktake, user.id);

        setStocktakeCloudStatus("Saving counted products…", "working");
        await insertStocktakeItems(header.id, stocktake.items);

        for (let index = 0; index < stocktake.items.length; index += 1) {
            const item = stocktake.items[index];
            setStocktakeCloudStatus(
                `Updating product ${index + 1} of ${stocktake.items.length}: ${item.productName}`,
                "working"
            );
            await updateStocktakeProduct(item);
            await saveCloudStockMovement(item);
        }

        setStocktakeCloudStatus("Stocktake saved online successfully.", "success");
        console.log("Stocktake completed online:", header);
        return header;
    } catch (error) {
        console.error("Stocktake cloud save failed:", error);

        // Only remove the header when the process failed before all products were updated.
        // stocktake_items are removed automatically through ON DELETE CASCADE.
        if (header?.id) {
            await removeIncompleteStocktake(header.id);
        }

        setStocktakeCloudStatus(error.message || "Stocktake could not be saved online.", "error");
        return null;
    }
}

async function initializeCloudStocktake() {
    try {
        await confirmStocktakeSession();
        setStocktakeCloudStatus("Cloud connection ready.", "success");
        console.log("cloud-stocktake.js initialized");
    } catch (error) {
        console.error("Cloud stocktake initialization failed:", error);
        setStocktakeCloudStatus(error.message || "Cloud connection unavailable.", "error");
    }
}

document.addEventListener("DOMContentLoaded", initializeCloudStocktake, { once: true });
console.log("cloud-stocktake.js loaded");
