//======================================================
// TYS POS v3
// LOW STOCK ALERTS MODULE
//======================================================

function getAlertInventory() {
    return loadState().inventory || [];
}

function renderLowStockAlerts() {
    const inventory = getAlertInventory();

    const lowStock = inventory.filter(product => {
        const level = Number(product.lowStock || 5);
        return Number(product.stock || 0) > 0 &&
               Number(product.stock || 0) <= level;
    });

    const outStock = inventory.filter(product => {
        return Number(product.stock || 0) <= 0;
    });

    const allAlerts = [...outStock, ...lowStock];

    const lowCount = document.getElementById("alert-low-count");
    const outCount = document.getElementById("alert-out-count");
    const totalProducts = document.getElementById("alert-total-products");
    const list = document.getElementById("low-stock-list");

    if (lowCount) lowCount.textContent = lowStock.length;
    if (outCount) outCount.textContent = outStock.length;
    if (totalProducts) totalProducts.textContent = inventory.length;

    if (!list) return;

    if (!allAlerts.length) {
        list.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        No low stock products.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = allAlerts.map(product => {
        const stock = Number(product.stock || 0);
        const level = Number(product.lowStock || 5);

        const status = stock <= 0
            ? "Out of Stock"
            : "Low Stock";

        return `
            <tr>
                <td><strong>${product.name}</strong></td>
                <td>${product.sku || "-"}</td>
                <td>${product.category || "-"}</td>
                <td>${stock}</td>
                <td>${level}</td>
                <td>${status}</td>
                <td>
                    <a href="inventory.html" class="secondary-btn">
                        Update Stock
                    </a>
                </td>
            </tr>
        `;
    }).join("");
}

document.addEventListener("DOMContentLoaded", renderLowStockAlerts);