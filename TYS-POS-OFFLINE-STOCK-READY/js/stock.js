function renderStockMovements() {
    const container = document.getElementById("stock-history-list");

    if (!container) return;

    const movements = getStockMovements();

    if (!movements.length) {
        container.innerHTML = `
            <div class="empty-state">
                No stock movements recorded yet.
            </div>
        `;
        return;
    }

    container.innerHTML = movements.map(movement => `
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
                <strong>${movement.quantity}</strong>
            </div>
        </div>
    `).join("");
}

function initializeStockModule() {
    renderStockMovements();
}

document.addEventListener("DOMContentLoaded", () => {
    initializeStockModule();
});