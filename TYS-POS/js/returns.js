//======================================================
// TYS POS v3
// RETURNS & REFUNDS MODULE
//======================================================

const RETURN_KEY = "tys-pos-returns";

function getReturns() {
    try {
        return JSON.parse(localStorage.getItem(RETURN_KEY)) || [];
    } catch {
        return [];
    }
}

function saveReturns(returns) {
    localStorage.setItem(RETURN_KEY, JSON.stringify(returns));
}

function populateReturnSales() {
    const select = document.getElementById("return-sale");

    if (!select) return;

    const sales = loadState().sales || [];

    select.innerHTML = `<option value="">Select Sale</option>`;

    sales.forEach(sale => {
        const option = document.createElement("option");

        option.value = sale.id;
        option.textContent = `${formatDateTime(sale.date)} - ${formatCurrency(sale.total)}`;

        select.appendChild(option);
    });
}

function populateReturnItems() {
    const saleId = document.getElementById("return-sale").value;
    const itemSelect = document.getElementById("return-item");

    if (!itemSelect) return;

    const sale = (loadState().sales || []).find(item => item.id === saleId);

    itemSelect.innerHTML = `<option value="">Select Item</option>`;

    if (!sale) return;

    (sale.items || []).forEach((item, index) => {
        const option = document.createElement("option");

        option.value = index;
        option.textContent = `${item.name} - Qty ${item.quantity}`;

        itemSelect.appendChild(option);
    });
}

function saveReturn() {
    const saleId = document.getElementById("return-sale").value;
    const itemIndex = document.getElementById("return-item").value;
    const qty = Number(document.getElementById("return-qty").value);
    const reason = document.getElementById("return-reason").value.trim();

    const state = loadState();

    const sale = (state.sales || []).find(item => item.id === saleId);

    if (!sale) {
        alert("Sale not found.");
        return;
    }

    const soldItem = sale.items[Number(itemIndex)];

    if (!soldItem) {
        alert("Item not found.");
        return;
    }

    if (qty <= 0 || qty > Number(soldItem.quantity)) {
        alert("Invalid return quantity.");
        return;
    }

    const refundAmount = Number(soldItem.price || 0) * qty;
    const refundCost = Number(soldItem.cost || 0) * qty;
    const refundProfit = refundAmount - refundCost;

    const product = state.inventory.find(product => {
        return product.id === (soldItem.productId || soldItem.id);
    });

    if (product) {
        product.stock = Number(product.stock || 0) + qty;
    }

    const returns = getReturns();

    returns.unshift({
    id: generateId("RET-"),
    saleId,
    productId: soldItem.productId || soldItem.id,
    productName: soldItem.name,
    quantity: qty,
    refundAmount,
    refundCost,
    refundProfit,
    reason,
    date: new Date().toISOString()
});
    saveReturns(returns);
    sale.total = Number(sale.total || 0) - refundAmount;
sale.subtotal = Number(sale.subtotal || 0) - refundAmount;
sale.cost = Number(sale.cost || 0) - refundCost;
sale.profit = Number(sale.profit || 0) - refundProfit;

if (sale.total < 0) sale.total = 0;
if (sale.subtotal < 0) sale.subtotal = 0;
if (sale.cost < 0) sale.cost = 0;
if (sale.profit < 0) sale.profit = 0;

    saveState({
        inventory: state.inventory,
        sales: state.sales
    });

    if (product) {
        recordStockMovement({
            productId: product.id,
            productName: product.name,
            type: "Return",
            quantity: qty,
            notes: reason || "Returned item"
        });
    }

    renderReturns();
    updateReturnSummary();

    document.getElementById("return-form").reset();
    populateReturnItems();

    alert("Return saved.");
}

function renderReturns() {
    const list = document.getElementById("return-list");

    if (!list) return;

    const returns = getReturns();

    if (!returns.length) {
        list.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">No returns recorded.</div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = returns.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.saleId}</td>
            <td>${item.productName}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.refundAmount)}</td>
            <td>${item.reason || "-"}</td>
        </tr>
    `).join("");
}

function updateReturnSummary() {
    const returns = getReturns();

    const count = document.getElementById("return-count");
    const total = document.getElementById("return-total");

    if (count) count.textContent = returns.length;

    if (total) {
        total.textContent = formatCurrency(
            returns.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0)
        );
    }
}

function initializeReturnsModule() {
    populateReturnSales();
    renderReturns();
    updateReturnSummary();

    const saleSelect = document.getElementById("return-sale");

    if (saleSelect) {
        saleSelect.addEventListener("change", populateReturnItems);
    }

    const form = document.getElementById("return-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveReturn();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeReturnsModule);