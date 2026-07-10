//======================================================
// TYS POS v3
// CASH REGISTER / SHIFT MODULE
//======================================================

const REGISTER_KEY = "tys-pos-registers";
const ACTIVE_REGISTER_KEY = "tys-pos-active-register";

//------------------------------------------------------
// STORAGE
//------------------------------------------------------

function getRegisters() {
    try {
        return JSON.parse(localStorage.getItem(REGISTER_KEY)) || [];
    } catch {
        return [];
    }
}

function saveRegisters(registers) {
    localStorage.setItem(REGISTER_KEY, JSON.stringify(registers));
}

function getActiveRegister() {
    try {
        return JSON.parse(localStorage.getItem(ACTIVE_REGISTER_KEY)) || null;
    } catch {
        return null;
    }
}

function saveActiveRegister(register) {
    localStorage.setItem(ACTIVE_REGISTER_KEY, JSON.stringify(register));
}

function clearActiveRegister() {
    localStorage.removeItem(ACTIVE_REGISTER_KEY);
}

//------------------------------------------------------
// SALES DURING REGISTER SHIFT
//------------------------------------------------------

function getRegisterCashSales(openedAt = null, closedAt = null) {
    const sales = loadState().sales || [];

    return sales.reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);
}
//------------------------------------------------------
// OPEN REGISTER
//------------------------------------------------------

function openRegister() {
    if (getActiveRegister()) {
        alert("Register is already open.");
        return;
    }

    const openingCash = Number(document.getElementById("opening-cash").value);
    const cashier = document.getElementById("register-cashier").value.trim();

    if (isNaN(openingCash) || openingCash < 0) {
        alert("Enter valid opening cash.");
        return;
    }

    const register = {
        id: generateId("REG-"),
        cashier: cashier || "Admin",
        openingCash,
        openedAt: new Date().toISOString(),
        status: "Open"
    };

    saveActiveRegister(register);

    document.getElementById("open-register-form").reset();

    renderRegisterDashboard();
    renderRegisterHistory();

    alert("Register opened.");
}

//------------------------------------------------------
// CLOSE REGISTER
//------------------------------------------------------

function closeRegister() {
    const active = getActiveRegister();

    if (!active) {
        alert("No active register.");
        return;
    }

    const actualCash = Number(document.getElementById("actual-cash").value);
    const notes = document.getElementById("register-notes").value.trim();

    if (isNaN(actualCash) || actualCash < 0) {
        alert("Enter valid actual cash.");
        return;
    }

    const closedAt = new Date().toISOString();

    const cashSales = getRegisterCashSales(
        active.openedAt,
        closedAt
    );

    const expectedCash = Number(active.openingCash || 0) + cashSales;

    const difference = actualCash - expectedCash;

    const closedRegister = {
        ...active,
        cashSales,
        expectedCash,
        actualCash,
        difference,
        notes,
        closedAt,
        status: "Closed"
    };

    const registers = getRegisters();

    registers.unshift(closedRegister);

    saveRegisters(registers);

    clearActiveRegister();

    document.getElementById("close-register-form").reset();

    renderRegisterDashboard();
    renderRegisterHistory();

    alert("Register closed.");
}

//------------------------------------------------------
// DASHBOARD
//------------------------------------------------------

function renderRegisterDashboard() {
    const active = getActiveRegister();

    const opening = active ? Number(active.openingCash || 0) : 0;

    const cashSales = (loadState().sales || []).reduce((sum, sale) => {
        return sum + Number(sale.total || 0);
    }, 0);

    const expected = opening + cashSales;

    const openingEl = document.getElementById("register-opening");
    const salesEl = document.getElementById("register-sales");
    const expectedEl = document.getElementById("register-expected");
    const differenceEl = document.getElementById("register-difference");

    if (openingEl) openingEl.textContent = formatCurrency(opening);
    if (salesEl) salesEl.textContent = formatCurrency(cashSales);
    if (expectedEl) expectedEl.textContent = formatCurrency(expected);
    if (differenceEl) differenceEl.textContent = formatCurrency(0);
}

//------------------------------------------------------
// HISTORY
//------------------------------------------------------

function renderRegisterHistory() {
    const list = document.getElementById("register-history");

    if (!list) return;

    const registers = getRegisters();
    const active = getActiveRegister();

    const allRegisters = active
        ? [active, ...registers]
        : registers;

    if (!allRegisters.length) {
        list.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        No register history.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = allRegisters.map(register => {
        const isOpen = register.status === "Open";

        const cashSales = isOpen
            ? getRegisterCashSales(register.openedAt)
            : Number(register.cashSales || 0);

        const expectedCash = isOpen
            ? Number(register.openingCash || 0) + cashSales
            : Number(register.expectedCash || 0);

        return `
            <tr>
                <td>${formatDate(register.openedAt)}</td>
                <td>${register.cashier || "-"}</td>
                <td>${formatCurrency(register.openingCash || 0)}</td>
                <td>${formatCurrency(cashSales)}</td>
                <td>${formatCurrency(expectedCash)}</td>
                <td>${isOpen ? "-" : formatCurrency(register.actualCash || 0)}</td>
                <td>${isOpen ? "-" : formatCurrency(register.difference || 0)}</td>
                <td>${register.status}</td>
            </tr>
        `;
    }).join("");
}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeRegisterModule() {
    renderRegisterDashboard();
    renderRegisterHistory();

    const openForm = document.getElementById("open-register-form");

    if (openForm && !openForm.dataset.ready) {
        openForm.dataset.ready = "true";

        openForm.addEventListener("submit", e => {
            e.preventDefault();
            openRegister();
        });
    }

    const closeForm = document.getElementById("close-register-form");

    if (closeForm && !closeForm.dataset.ready) {
        closeForm.dataset.ready = "true";

        closeForm.addEventListener("submit", e => {
            e.preventDefault();
            closeRegister();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeRegisterModule);