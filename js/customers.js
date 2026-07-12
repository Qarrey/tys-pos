//======================================================
// TYS POS v3
// CUSTOMERS & CREDIT MODULE
//======================================================

const CUSTOMER_KEY = "tys-pos-customers";
const CREDIT_KEY = "tys-pos-credit-sales";


//======================================================
// LOCAL STORAGE
//======================================================

function getCustomers() {
    try {
        return JSON.parse(
            localStorage.getItem(CUSTOMER_KEY)
        ) || [];
    } catch (error) {
        console.error("Could not load customers:", error);
        return [];
    }
}

function saveCustomers(customers) {
    localStorage.setItem(
        CUSTOMER_KEY,
        JSON.stringify(customers || [])
    );
}

function getCreditSales() {
    try {
        return JSON.parse(
            localStorage.getItem(CREDIT_KEY)
        ) || [];
    } catch (error) {
        console.error("Could not load credit sales:", error);
        return [];
    }
}

function saveCreditSales(credits) {
    localStorage.setItem(
        CREDIT_KEY,
        JSON.stringify(credits || [])
    );
}


//======================================================
// SAVE CUSTOMER
//======================================================

async function saveCustomer() {
    const nameInput =
        document.getElementById("customer-name");

    const phoneInput =
        document.getElementById("customer-phone");

    const notesInput =
        document.getElementById("customer-notes");

    if (!nameInput) {
        alert("Customer form not found.");
        return;
    }

    const name =
        nameInput.value.trim();

    const phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";

    const notes =
        notesInput
            ? notesInput.value.trim()
            : "";

    if (!name) {
        alert("Customer name is required.");
        return;
    }

    const localCustomer = {
        id:
            typeof generateId === "function"
                ? generateId("CUS-")
                : `CUS-${Date.now()}`,

        name,
        phone,
        notes,
        createdAt:
            new Date().toISOString()
    };

    let customers =
        getCustomers();

    customers.unshift(localCustomer);

    saveCustomers(customers);

    renderCustomers();
    populateCustomerDropdown();
    updateCustomerSummary();

    const form =
        document.getElementById("customer-form");

    if (form) {
        form.reset();
    }

    if (
        typeof saveCustomerToSupabase ===
        "function"
    ) {
        try {
            const cloudCustomer =
                await saveCustomerToSupabase(
                    localCustomer
                );

            if (cloudCustomer) {
                console.log(
                    "Customer saved locally and online."
                );

                if (
                    typeof syncCloudCustomersToPOS ===
                    "function"
                ) {
                    await syncCloudCustomersToPOS();
                }
            }
        } catch (error) {
            console.error(
                "Cloud customer save failed:",
                error
            );

            alert(
                "Customer was saved on this device but not online."
            );
        }
    }

    alert("Customer saved.");
}


//======================================================
// CUSTOMER DROPDOWN
//======================================================

function populateCustomerDropdown() {
    const select =
        document.getElementById(
            "credit-customer"
        );

    if (!select) return;

    const customers =
        getCustomers();

    select.innerHTML = `
        <option value="">
            Select Customer
        </option>
    `;

    customers
        .slice()
        .sort((a, b) =>
            String(a.name || "")
                .localeCompare(
                    String(b.name || "")
                )
        )
        .forEach(customer => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                customer.id;

            option.textContent =
                customer.name ||
                "Unnamed Customer";

            select.appendChild(option);
        });
}


//======================================================
// RENDER CUSTOMERS
//======================================================

function renderCustomers(search = "") {
    const list =
        document.getElementById(
            "customer-list"
        );

    if (!list) return;

    const keyword =
        String(search || "")
            .trim()
            .toLowerCase();

    const customers =
        getCustomers();

    const filtered =
        customers.filter(customer => {
            const name =
                String(
                    customer.name || ""
                ).toLowerCase();

            const phone =
                String(
                    customer.phone || ""
                ).toLowerCase();

            const notes =
                String(
                    customer.notes || ""
                ).toLowerCase();

            return (
                name.includes(keyword) ||
                phone.includes(keyword) ||
                notes.includes(keyword)
            );
        });

    if (!filtered.length) {
        list.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        No customers recorded.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    list.innerHTML =
        filtered.map(customer => `
            <tr>
                <td>
                    <strong>
                        ${customer.name || "-"}
                    </strong>
                </td>

                <td>
                    ${customer.phone || "-"}
                </td>

                <td>
                    ${customer.notes || "-"}
                </td>

                <td>
                    <button
                        type="button"
                        class="danger-btn delete-customer"
                        data-id="${customer.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");

    document
        .querySelectorAll(
            ".delete-customer"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    deleteCustomer(
                        button.dataset.id
                    );
                }
            );
        });
}


//======================================================
// DELETE CUSTOMER
//======================================================

async function deleteCustomer(id) {
    let customers =
        getCustomers();

    const customer =
        customers.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!customer) return;

    const outstandingCredits =
        getCreditSales().filter(
            credit =>
                String(credit.customerId) ===
                String(id) &&
                Number(
                    credit.balance || 0
                ) > 0
        );

    if (outstandingCredits.length) {
        alert(
            "This customer still has an outstanding balance."
        );

        return;
    }

    if (
        !confirm(
            `Delete "${customer.name}"?`
        )
    ) {
        return;
    }

    customers =
        customers.filter(
            item =>
                String(item.id) !==
                String(id)
        );

    saveCustomers(customers);

    renderCustomers();
    populateCustomerDropdown();
    updateCustomerSummary();

    if (
        typeof deleteCustomerFromSupabase ===
        "function"
    ) {
        try {
            const success =
                await deleteCustomerFromSupabase(
                    id
                );

            if (
                success &&
                typeof syncCloudCustomersToPOS ===
                "function"
            ) {
                await syncCloudCustomersToPOS();
            }
        } catch (error) {
            console.error(
                "Cloud customer deletion failed:",
                error
            );
        }
    }
}


//======================================================
// SAVE CREDIT SALE
//======================================================

async function saveCreditSale() {
    const customerSelect =
        document.getElementById(
            "credit-customer"
        );

    const descriptionInput =
        document.getElementById(
            "credit-description"
        );

    const amountInput =
        document.getElementById(
            "credit-amount"
        );

    const paidInput =
        document.getElementById(
            "credit-paid-amount"
        );

    const dateInput =
        document.getElementById(
            "credit-date"
        );

    const customerId =
        customerSelect
            ? customerSelect.value
            : "";

    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";

    const amount =
        amountInput
            ? Number(amountInput.value)
            : 0;

    const paid =
        paidInput
            ? Number(paidInput.value || 0)
            : 0;

    const date =
        dateInput &&
        dateInput.value
            ? new Date(
                `${dateInput.value}T12:00:00`
            ).toISOString()
            : new Date().toISOString();

    if (!customerId || amount <= 0) {
        alert(
            "Select a customer and enter the credit amount."
        );

        return;
    }

    if (
        !Number.isFinite(paid) ||
        paid < 0 ||
        paid > amount
    ) {
        alert(
            "Amount paid cannot be more than the credit amount."
        );

        return;
    }

    const customer =
        getCustomers().find(
            item =>
                String(item.id) ===
                String(customerId)
        );

    if (!customer) {
        alert("Customer not found.");
        return;
    }

    const balance =
        amount - paid;

    const creditSale = {
        id:
            typeof generateId === "function"
                ? generateId("CRD-")
                : `CRD-${Date.now()}`,

        customerId:
            customer.id,

        customerName:
            customer.name,

        description,

        amount,

        paid,

        balance,

        date
    };

    const creditSales =
        getCreditSales();

    creditSales.unshift(
        creditSale
    );

    saveCreditSales(
        creditSales
    );

    renderCreditSales();
    updateCustomerSummary();

    const form =
        document.getElementById(
            "credit-form"
        );

    if (form) {
        form.reset();
    }

    if (
        typeof saveCreditSaleToSupabase ===
        "function"
    ) {
        try {
            const result =
                await saveCreditSaleToSupabase(
                    creditSale
                );

            if (result) {
                console.log(
                    "Credit record saved locally and online."
                );

                if (
                    typeof syncCloudCreditSalesToPOS ===
                    "function"
                ) {
                    await syncCloudCreditSalesToPOS();
                }
            }
        } catch (error) {
            console.error(
                "Cloud credit save failed:",
                error
            );

            alert(
                "Credit sale was saved on this device but not online."
            );
        }
    }
}


//======================================================
// RENDER CREDIT SALES
//======================================================

function renderCreditSales() {
    const list =
        document.getElementById(
            "credit-list"
        );

    if (!list) return;

    const credits =
        getCreditSales();

    if (!credits.length) {
        list.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        No credit sales recorded.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    list.innerHTML =
        credits.map(credit => `
            <tr>
                <td>
                    ${
                        typeof formatDate ===
                        "function"
                            ? formatDate(
                                credit.date
                            )
                            : credit.date
                    }
                </td>

                <td>
                    ${credit.customerName || "-"}
                </td>

                <td>
                    ${credit.description || "-"}
                </td>

                <td>
                    ${formatCurrency(
                        credit.amount || 0
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        credit.paid || 0
                    )}
                </td>

                <td>
                    <strong>
                        ${formatCurrency(
                            credit.balance || 0
                        )}
                    </strong>
                </td>

                <td>
                    ${
                        Number(
                            credit.balance || 0
                        ) > 0
                            ? `
                                <button
                                    type="button"
                                    class="primary-btn record-payment"
                                    data-id="${credit.id}">
                                    Pay
                                </button>
                            `
                            : `
                                <span class="status-badge">
                                    Paid
                                </span>
                            `
                    }

                    <button
                        type="button"
                        class="danger-btn delete-credit"
                        data-id="${credit.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `).join("");

    document
        .querySelectorAll(
            ".record-payment"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    recordCreditPayment(
                        button.dataset.id
                    );
                }
            );
        });

    document
        .querySelectorAll(
            ".delete-credit"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    deleteCreditSale(
                        button.dataset.id
                    );
                }
            );
        });
}


//======================================================
// RECORD CREDIT PAYMENT
//======================================================

async function recordCreditPayment(id) {
    const credits =
        getCreditSales();

    const credit =
        credits.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!credit) return;

    const payment =
        Number(
            prompt(
                `Outstanding balance: ${formatCurrency(
                    credit.balance
                )}\n\nEnter payment amount:`
            )
        );

    if (
        !Number.isFinite(payment) ||
        payment <= 0
    ) {
        return;
    }

    if (
        payment >
        Number(
            credit.balance || 0
        )
    ) {
        alert(
            "Payment is more than the outstanding balance."
        );

        return;
    }

    credit.paid =
        Number(
            credit.paid || 0
        ) + payment;

    credit.balance =
        Math.max(
            0,
            Number(
                credit.amount || 0
            ) -
            Number(
                credit.paid || 0
            )
        );

    saveCreditSales(
        credits
    );

    renderCreditSales();
    updateCustomerSummary();

    if (
        typeof updateCreditSaleInSupabase ===
        "function"
    ) {
        try {
            const success =
                await updateCreditSaleInSupabase(
                    credit
                );

            if (
                success &&
                typeof syncCloudCreditSalesToPOS ===
                "function"
            ) {
                await syncCloudCreditSalesToPOS();
            }
        } catch (error) {
            console.error(
                "Cloud credit payment update failed:",
                error
            );
        }
    }
}


//======================================================
// DELETE CREDIT SALE
//======================================================

async function deleteCreditSale(id) {
    let credits =
        getCreditSales();

    const credit =
        credits.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!credit) return;

    if (
        !confirm(
            `Delete credit record for "${credit.customerName}"?`
        )
    ) {
        return;
    }

    credits =
        credits.filter(
            item =>
                String(item.id) !==
                String(id)
        );

    saveCreditSales(
        credits
    );

    renderCreditSales();
    updateCustomerSummary();

    if (
        typeof deleteCreditSaleFromSupabase ===
        "function"
    ) {
        try {
            const success =
                await deleteCreditSaleFromSupabase(
                    id
                );

            if (
                success &&
                typeof syncCloudCreditSalesToPOS ===
                "function"
            ) {
                await syncCloudCreditSalesToPOS();
            }
        } catch (error) {
            console.error(
                "Cloud credit deletion failed:",
                error
            );
        }
    }
}


//======================================================
// CUSTOMER SUMMARY
//======================================================

function updateCustomerSummary() {
    const customers =
        getCustomers();

    const credits =
        getCreditSales();

    const totalCredit =
        credits.reduce(
            (sum, credit) =>
                sum +
                Number(
                    credit.amount || 0
                ),
            0
        );

    const totalPaid =
        credits.reduce(
            (sum, credit) =>
                sum +
                Number(
                    credit.paid || 0
                ),
            0
        );

    const totalBalance =
        credits.reduce(
            (sum, credit) =>
                sum +
                Number(
                    credit.balance || 0
                ),
            0
        );

    const countEl =
        document.getElementById(
            "customer-count"
        );

    const totalEl =
        document.getElementById(
            "credit-total"
        );

    const paidEl =
        document.getElementById(
            "credit-paid"
        );

    const balanceEl =
        document.getElementById(
            "credit-balance"
        );

    if (countEl) {
        countEl.textContent =
            customers.length;
    }

    if (totalEl) {
        totalEl.textContent =
            formatCurrency(totalCredit);
    }

    if (paidEl) {
        paidEl.textContent =
            formatCurrency(totalPaid);
    }

    if (balanceEl) {
        balanceEl.textContent =
            formatCurrency(totalBalance);
    }
}


//======================================================
// SEARCH
//======================================================

function initializeCustomerSearch() {
    const search =
        document.getElementById(
            "customer-search"
        );

    if (!search) return;

    if (!search.dataset.ready) {
        search.dataset.ready = "true";

        search.addEventListener(
            "input",
            () => {
                renderCustomers(
                    search.value
                );
            }
        );
    }

    const clear =
        document.getElementById(
            "clear-customer-search"
        );

    if (
        clear &&
        !clear.dataset.ready
    ) {
        clear.dataset.ready = "true";

        clear.addEventListener(
            "click",
            () => {
                search.value = "";
                renderCustomers();
            }
        );
    }
}


//======================================================
// INITIALIZE
//======================================================

function initializeCustomersModule() {
    renderCustomers();
    populateCustomerDropdown();
    renderCreditSales();
    updateCustomerSummary();
    initializeCustomerSearch();

    const customerForm =
        document.getElementById(
            "customer-form"
        );

    if (
        customerForm &&
        !customerForm.dataset.ready
    ) {
        customerForm.dataset.ready =
            "true";

        customerForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                saveCustomer();
            }
        );
    }

    const creditForm =
        document.getElementById(
            "credit-form"
        );

    if (
        creditForm &&
        !creditForm.dataset.ready
    ) {
        creditForm.dataset.ready =
            "true";

        creditForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                saveCreditSale();
            }
        );
    }
}


//======================================================
// AUTO START
//======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeCustomersModule
);