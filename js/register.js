//======================================================
// TYS POS v3
// CASH REGISTER / SHIFT MODULE
// LOCAL + SUPABASE
//======================================================

const REGISTER_KEY =
    "tys-pos-registers";

const ACTIVE_REGISTER_KEY =
    "tys-pos-active-register";


//======================================================
// LOCAL STORAGE
//======================================================

function getRegisters() {
    try {
        return (
            JSON.parse(
                localStorage.getItem(
                    REGISTER_KEY
                )
            ) || []
        );

    } catch (error) {
        console.error(
            "Could not load register history:",
            error
        );

        return [];
    }
}


function saveRegisters(registers) {
    localStorage.setItem(
        REGISTER_KEY,
        JSON.stringify(
            registers || []
        )
    );
}


function getActiveRegister() {
    try {
        return (
            JSON.parse(
                localStorage.getItem(
                    ACTIVE_REGISTER_KEY
                )
            ) || null
        );

    } catch (error) {
        console.error(
            "Could not load active register:",
            error
        );

        return null;
    }
}


function saveActiveRegister(register) {
    localStorage.setItem(
        ACTIVE_REGISTER_KEY,
        JSON.stringify(register)
    );
}


function clearActiveRegister() {
    localStorage.removeItem(
        ACTIVE_REGISTER_KEY
    );
}


//======================================================
// CURRENT USER
//======================================================

function getRegisterUser() {
    let sessionUser = null;

    try {
        if (
            typeof getCurrentUser ===
            "function"
        ) {
            sessionUser =
                getCurrentUser();
        }
    } catch (error) {
        console.warn(
            "Could not read current POS user:",
            error
        );
    }

    return {
        id:
            sessionUser?.id ||
            sessionUser?.userId ||
            "",

        name:
            sessionUser?.name ||
            sessionUser?.fullName ||
            sessionUser?.email ||
            "Admin"
    };
}


//======================================================
// SALE DATE
//======================================================

function getRegisterSaleDate(sale) {
    return new Date(
        sale.saleDate ||
        sale.sale_date ||
        sale.date ||
        sale.createdAt ||
        sale.created_at ||
        0
    );
}


//======================================================
// PAYMENT METHOD
//======================================================

function getRegisterPaymentMethod(sale) {
    return String(
        sale.paymentMethod ||
        sale.payment_method ||
        "Cash"
    )
        .trim()
        .toLowerCase();
}


//======================================================
// CASH SALES DURING SHIFT
//======================================================

function getRegisterCashSales(
    openedAt = null,
    closedAt = null
) {
    let sales = [];

    try {
        if (
            typeof loadState ===
            "function"
        ) {
            sales =
                loadState().sales ||
                [];
        }

    } catch (error) {
        console.error(
            "Could not load sales for register:",
            error
        );

        return 0;
    }

    const openingTime =
        openedAt
            ? new Date(openedAt)
            : null;

    const closingTime =
        closedAt
            ? new Date(closedAt)
            : null;


    return sales.reduce(
        (total, sale) => {

            //--------------------------------------------------
            // ONLY CASH SALES
            //--------------------------------------------------

            const paymentMethod =
                getRegisterPaymentMethod(
                    sale
                );

            if (
                paymentMethod !==
                "cash"
            ) {
                return total;
            }


            //--------------------------------------------------
            // ONLY SALES DURING THIS SHIFT
            //--------------------------------------------------

            const saleDate =
                getRegisterSaleDate(
                    sale
                );

            if (
                Number.isNaN(
                    saleDate.getTime()
                )
            ) {
                return total;
            }

            if (
                openingTime &&
                saleDate < openingTime
            ) {
                return total;
            }

            if (
                closingTime &&
                saleDate > closingTime
            ) {
                return total;
            }


            return (
                total +
                Number(
                    sale.total || 0
                )
            );

        },
        0
    );
}


//======================================================
// OPEN REGISTER
//======================================================

async function openRegister() {
    if (getActiveRegister()) {
        alert(
            "Register is already open."
        );

        return;
    }

    const openingCashInput =
        document.getElementById(
            "opening-cash"
        );

    const cashierInput =
        document.getElementById(
            "register-cashier"
        );

    const openingCash =
        Number(
            openingCashInput
                ? openingCashInput.value
                : 0
        );

    if (
        Number.isNaN(openingCash) ||
        openingCash < 0
    ) {
        alert(
            "Enter valid opening cash."
        );

        return;
    }


    //--------------------------------------------------
    // CURRENT LOGGED-IN USER
    //--------------------------------------------------

    const currentUser =
        getRegisterUser();

    const typedCashier =
        cashierInput
            ? cashierInput.value.trim()
            : "";

    const register = {
        id:
            typeof generateId ===
            "function"
                ? generateId("REG-")
                : `REG-${Date.now()}`,

        cashierId:
            currentUser.id,

        cashier:
            typedCashier ||
            currentUser.name ||
            "Admin",

        openingCash,

        openedAt:
            new Date()
                .toISOString(),

        cashSales:
            0,

        expectedCash:
            openingCash,

        actualCash:
            null,

        difference:
            null,

        notes:
            "",

        closedAt:
            null,

        status:
            "Open"
    };


    //--------------------------------------------------
    // SAVE LOCALLY FIRST
    //--------------------------------------------------

    saveActiveRegister(
        register
    );

    renderRegisterDashboard();
    renderRegisterHistory();


    //--------------------------------------------------
    // SAVE ONLINE
    //--------------------------------------------------

    if (
        typeof openRegisterInSupabase ===
        "function"
    ) {
        try {
            const cloudRegister =
                await openRegisterInSupabase(
                    register
                );

            if (cloudRegister) {
                saveActiveRegister(
                    cloudRegister
                );

                renderRegisterDashboard();
                renderRegisterHistory();

                console.log(
                    "Register opened locally and online."
                );
            }

        } catch (error) {
            console.error(
                "Could not open register online:",
                error
            );

            alert(
                "Register opened on this device but was not saved online."
            );
        }
    }


    const form =
        document.getElementById(
            "open-register-form"
        );

    if (form) {
        form.reset();
    }

    alert(
        "Register opened."
    );
}


//======================================================
// CLOSE REGISTER
//======================================================

async function closeRegister() {
    const active =
        getActiveRegister();

    if (!active) {
        alert(
            "No active register."
        );

        return;
    }

    const actualCashInput =
        document.getElementById(
            "actual-cash"
        );

    const notesInput =
        document.getElementById(
            "register-notes"
        );

    const actualCash =
        Number(
            actualCashInput
                ? actualCashInput.value
                : NaN
        );

    const notes =
        notesInput
            ? notesInput.value.trim()
            : "";

    if (
        Number.isNaN(actualCash) ||
        actualCash < 0
    ) {
        alert(
            "Enter valid actual cash."
        );

        return;
    }


    const closedAt =
        new Date()
            .toISOString();


    const cashSales =
        getRegisterCashSales(
            active.openedAt,
            closedAt
        );


    const expectedCash =
        Number(
            active.openingCash ||
            0
        ) +
        cashSales;


    const difference =
        actualCash -
        expectedCash;


    const closedRegister = {
        ...active,

        cashSales,

        expectedCash,

        actualCash,

        difference,

        notes,

        closedAt,

        status:
            "Closed"
    };


    //--------------------------------------------------
    // SAVE LOCALLY
    //--------------------------------------------------

    const registers =
        getRegisters();

    registers.unshift(
        closedRegister
    );

    saveRegisters(
        registers
    );

    clearActiveRegister();

    renderRegisterDashboard();
    renderRegisterHistory();


    //--------------------------------------------------
    // UPDATE ONLINE
    //--------------------------------------------------

    if (
        typeof closeRegisterInSupabase ===
        "function"
    ) {
        try {
            await closeRegisterInSupabase(
                closedRegister
            );

            console.log(
                "Register closed locally and online."
            );

        } catch (error) {
            console.error(
                "Could not close register online:",
                error
            );

            alert(
                "Register closed on this device but was not updated online."
            );
        }
    }


    const form =
        document.getElementById(
            "close-register-form"
        );

    if (form) {
        form.reset();
    }


    alert(
        "Register closed."
    );
}


//======================================================
// REGISTER DASHBOARD
//======================================================

function renderRegisterDashboard() {
    const active =
        getActiveRegister();

    const openingCash =
        active
            ? Number(
                active.openingCash ||
                0
            )
            : 0;


    const cashSales =
        active
            ? getRegisterCashSales(
                active.openedAt
            )
            : 0;


    const expectedCash =
        openingCash +
        cashSales;


    const openingElement =
        document.getElementById(
            "register-opening"
        );

    const salesElement =
        document.getElementById(
            "register-sales"
        );

    const expectedElement =
        document.getElementById(
            "register-expected"
        );

    const differenceElement =
        document.getElementById(
            "register-difference"
        );


    if (openingElement) {
        openingElement.textContent =
            formatCurrency(
                openingCash
            );
    }


    if (salesElement) {
        salesElement.textContent =
            formatCurrency(
                cashSales
            );
    }


    if (expectedElement) {
        expectedElement.textContent =
            formatCurrency(
                expectedCash
            );
    }


    if (differenceElement) {
        differenceElement.textContent =
            formatCurrency(0);
    }
}


//======================================================
// REGISTER HISTORY
//======================================================

function renderRegisterHistory() {
    const list =
        document.getElementById(
            "register-history"
        );

    if (!list) {
        return;
    }


    const registers =
        getRegisters();


    const active =
        getActiveRegister();


    const allRegisters =
        active
            ? [
                active,
                ...registers
            ]
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


    list.innerHTML =
        allRegisters
            .map(register => {

                const isOpen =
                    register.status ===
                    "Open";


                const cashSales =
                    isOpen

                        ? getRegisterCashSales(
                            register.openedAt
                        )

                        : Number(
                            register.cashSales ||
                            0
                        );


                const expectedCash =
                    isOpen

                        ? Number(
                            register.openingCash ||
                            0
                        ) +
                        cashSales

                        : Number(
                            register.expectedCash ||
                            0
                        );


                return `
                    <tr>

                        <td>
                            ${
                                formatDate(
                                    register.openedAt
                                )
                            }
                        </td>

                        <td>
                            ${
                                register.cashier ||
                                "-"
                            }
                        </td>

                        <td>
                            ${
                                formatCurrency(
                                    register.openingCash ||
                                    0
                                )
                            }
                        </td>

                        <td>
                            ${
                                formatCurrency(
                                    cashSales
                                )
                            }
                        </td>

                        <td>
                            ${
                                formatCurrency(
                                    expectedCash
                                )
                            }
                        </td>

                        <td>
                            ${
                                isOpen

                                    ? "-"

                                    : formatCurrency(
                                        register.actualCash ||
                                        0
                                    )
                            }
                        </td>

                        <td>
                            ${
                                isOpen

                                    ? "-"

                                    : formatCurrency(
                                        register.difference ||
                                        0
                                    )
                            }
                        </td>

                        <td>
                            ${
                                register.status
                            }
                        </td>

                    </tr>
                `;

            })
            .join("");
}


//======================================================
// INITIALIZE REGISTER
//======================================================

function initializeRegisterModule() {
    renderRegisterDashboard();

    renderRegisterHistory();


    const openForm =
        document.getElementById(
            "open-register-form"
        );


    if (
        openForm &&
        !openForm.dataset.ready
    ) {
        openForm.dataset.ready =
            "true";


        openForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                openRegister();

            }
        );
    }


    const closeForm =
        document.getElementById(
            "close-register-form"
        );


    if (
        closeForm &&
        !closeForm.dataset.ready
    ) {
        closeForm.dataset.ready =
            "true";


        closeForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                closeRegister();

            }
        );
    }
}


//======================================================
// AUTO START
//======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeRegisterModule
);