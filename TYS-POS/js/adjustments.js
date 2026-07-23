function adjState() {
    return typeof loadState === "function" ? loadState() : { inventory: [] };
}

function renderAdjProducts() {
    const select = document.getElementById("adjustment-product");
    if (!select) return;

    const state = adjState();
    select.innerHTML = '<option value="">Select product</option>' +
        (state.inventory || [])
            .slice()
            .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
            .map(product => `<option value="${product.id}">${product.name}</option>`)
            .join("");
}

function renderAdjustments() {
    const body = document.getElementById("adjustment-list");
    if (!body) return;

    const adjustments = typeof getAdjustments === "function" ? getAdjustments() : [];
    body.innerHTML = adjustments.length
        ? adjustments.map(item => `
            <tr>
                <td>${typeof formatDateTime === "function" ? formatDateTime(item.date) : item.date}</td>
                <td>${item.source || "Manual adjustment"}</td>
                <td>${item.productName || "-"}</td>
                <td>${Number(item.quantityChange || 0)}</td>
                <td>${item.oldCost == null ? "-" : formatCurrency(item.oldCost)}</td>
                <td>${item.newCost == null ? "-" : formatCurrency(item.newCost)}</td>
                <td>${item.userName || "-"}</td>
                <td>${item.reason || "-"}</td>
            </tr>
        `).join("")
        : '<tr><td colspan="8"><div class="empty-state">No adjustments recorded.</div></td></tr>';
}

document.addEventListener("DOMContentLoaded", () => {
    renderAdjProducts();
    renderAdjustments();

    const form = document.getElementById("adjustment-form");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const state = adjState();
        const productId = document.getElementById("adjustment-product").value;
        const product = (state.inventory || []).find(item => String(item.id) === String(productId));
        const quantityChange = Number(document.getElementById("adjustment-qty").value || 0);
        const costText = document.getElementById("adjustment-cost").value.trim();
        const newCost = costText === "" ? null : Number(costText);
        const reason = document.getElementById("adjustment-reason").value.trim();

        if (!product || !reason || !Number.isFinite(quantityChange) || (newCost !== null && !Number.isFinite(newCost))) {
            return alert("Complete the adjustment correctly.");
        }

        const oldCost = Number(product.cost || 0);
        product.stock = Number(product.stock || 0) + quantityChange;
        if (newCost !== null) product.cost = newCost;
        saveState(state);

        const user = window.currentPOSUser || {};
        const adjustments = getAdjustments();
        adjustments.unshift({
            id: `ADJ-${Date.now()}`,
            date: new Date().toISOString(),
            source: "Manual adjustment",
            productId: product.id,
            productName: product.name,
            quantityChange,
            oldCost,
            newCost,
            userName: user.fullName || user.name || user.email || "Unknown user",
            reason
        });
        saveAdjustments(adjustments);

        form.reset();
        document.getElementById("adjustment-qty").value = "0";
        renderAdjustments();
        alert("Adjustment saved.");
    });
});
