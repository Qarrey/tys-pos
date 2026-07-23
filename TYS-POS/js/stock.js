//======================================================
// TYS POS
// STOCK MOVEMENTS — PURCHASES & INVENTORY CHANGES ONLY
//======================================================

let cloudStockMovementsChannel = null;

function isVisibleInventoryMovement(movement) {
    const type = String(movement?.type || "")
        .trim()
        .toLowerCase();

    if (!type) return false;

    // Sales are intentionally excluded from this page.
    if (type === "sale" || type.startsWith("sale ")) return false;

    return (
        type.includes("purchase") ||
        type.includes("adjust") ||
        type.includes("stock") ||
        type.includes("damage") ||
        type.includes("return") ||
        type.includes("correction") ||
        type.includes("inventory")
    );
}

function normalizeStockMovement(movement) {
    return {
        id: movement.id || movement.movementId || "",
        productId: movement.productId || movement.product_id || "",
        productName:
            movement.productName ||
            movement.product_name ||
            "Unknown Product",
        type: movement.type || "Inventory adjustment",
        quantity: Number(movement.quantity || 0),
        notes: movement.notes || "",
        date:
            movement.date ||
            movement.created_at ||
            new Date().toISOString()
    };
}

function movementSignature(movement) {
    const minute = String(movement.date || "").slice(0, 16);

    return [
        String(movement.productId || ""),
        String(movement.productName || "").trim().toLowerCase(),
        String(movement.type || "").trim().toLowerCase(),
        Number(movement.quantity || 0),
        String(movement.notes || "").trim().toLowerCase(),
        minute
    ].join("|");
}

function mergeStockMovements(...movementLists) {
    const merged = [];
    const seenIds = new Set();
    const seenSignatures = new Set();

    movementLists
        .flat()
        .map(normalizeStockMovement)
        .filter(isVisibleInventoryMovement)
        .forEach(movement => {
            const id = String(movement.id || "");
            const signature = movementSignature(movement);

            if (id && seenIds.has(id)) return;
            if (seenSignatures.has(signature)) return;

            if (id) seenIds.add(id);
            seenSignatures.add(signature);
            merged.push(movement);
        });

    return merged.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

async function loadCloudInventoryMovements() {
    if (typeof supabaseClient === "undefined") return [];

    const { data, error } = await supabaseClient
        .from("stock_movements")
        .select("id, product_id, product_name, type, quantity, notes, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud stock movements:", error);
        return [];
    }

    return (data || [])
        .map(normalizeStockMovement)
        .filter(isVisibleInventoryMovement);
}

async function syncInventoryMovements() {
    const localMovements =
        typeof getStockMovements === "function"
            ? getStockMovements()
            : [];

    const cloudMovements = await loadCloudInventoryMovements();
    const merged = mergeStockMovements(cloudMovements, localMovements);

    if (typeof saveStockMovements === "function") {
        saveStockMovements(merged);
    }

    renderStockMovements(merged);
    return merged;
}

function renderStockMovements(movements = null) {
    const container = document.getElementById("stock-history-list");
    if (!container) return;

    const visibleMovements = mergeStockMovements(
        Array.isArray(movements)
            ? movements
            : (typeof getStockMovements === "function"
                ? getStockMovements()
                : [])
    );

    if (!visibleMovements.length) {
        container.innerHTML = `
            <div class="empty-state">
                No purchase or inventory movements recorded yet.
            </div>
        `;
        return;
    }

    container.innerHTML = visibleMovements.map(movement => `
        <div class="inventory-row">
            <div>
                <strong>${movement.productName}</strong>
                <div class="small">${formatDateTime(movement.date)}</div>
                <div class="small">${movement.notes || ""}</div>
            </div>

            <div>
                <strong>${movement.type}</strong>
            </div>

            <div>
                <strong>${movement.quantity > 0 ? "+" : ""}${movement.quantity}</strong>
            </div>
        </div>
    `).join("");
}

function subscribeToInventoryMovements() {
    if (typeof supabaseClient === "undefined") return;

    if (cloudStockMovementsChannel) {
        supabaseClient.removeChannel(cloudStockMovementsChannel);
    }

    cloudStockMovementsChannel = supabaseClient
        .channel("tys-inventory-movements-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "stock_movements"
            },
            payload => {
                const movement = normalizeStockMovement(
                    payload.new || payload.old || {}
                );

                // Ignore sale events completely.
                if (!isVisibleInventoryMovement(movement)) return;

                syncInventoryMovements();
            }
        )
        .subscribe(status => {
            console.log("Inventory movements realtime:", status);
        });
}

async function initializeStockModule() {
    renderStockMovements();

    try {
        await syncInventoryMovements();
        subscribeToInventoryMovements();
    } catch (error) {
        console.error("Stock movement initialization failed:", error);
    }
}

document.addEventListener("DOMContentLoaded", initializeStockModule);
