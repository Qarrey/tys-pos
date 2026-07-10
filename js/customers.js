//======================================================
// TYS POS v3
// CUSTOMERS & CREDIT MODULE
//======================================================

const CUSTOMER_KEY = "tys-pos-customers";
const CREDIT_KEY = "tys-pos-credit-sales";

//------------------------------------------------------
// STORAGE
//------------------------------------------------------

function getCustomers() {
    try {
        return JSON.parse(
            localStorage.getItem(CUSTOMER_KEY)
        ) || [];
    } catch {
        return [];
    }
}

function saveCustomers(customers) {
    localStorage.setItem(
        CUSTOMER_KEY,
        JSON.stringify(customers)
    );
}

function getCreditSales() {
    try {
        return JSON.parse(
            localStorage.getItem(CREDIT_KEY)
        ) || [];
    } catch {
        return [];
    }
}

function saveCreditSales(credits) {
    localStorage.setItem(
        CREDIT_KEY,
        JSON.stringify(credits)
    );
}

//------------------------------------------------------
// SAVE CUSTOMER
//------------------------------------------------------

function saveCustomer() {
    const nameInput = document.getElementById("customer-name");
    const phoneInput = document.getElementById("customer-phone");
    const notesInput = document.getElementById("customer-notes");

    if (!nameInput) {
        alert("Customer form not found.");
        return;
    }

    const name = nameInput.value.trim();
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const notes = notesInput ? notesInput.value.trim() : "";

    if (!name) {
        alert("Customer name is required.");
        return;
    }

    const customers = getCustomers();

    customers.unshift({
        id: generateId("CUS-"),
        name,
        phone,
        notes,
        createdAt: new Date().toISOString()
    });

    saveCustomers(customers);

    renderCustomers();
    populateCustomerDropdown();
    updateCustomerSummary();

    document.getElementById("customer-form").reset();

    alert("Customer saved.");
}

//------------------------------------------------------
// CUSTOMER DROPDOWN
//------------------------------------------------------

function populateCustomerDropdown() {
    const select = document.getElementById(
        "credit-customer"
    );

    if (!select) return;

    const customers = getCustomers();

    select.innerHTML = `
        <option value="">
            Select Customer
        </option>
    `;

    customers.forEach(customer => {
        const option = document.createElement(
            "option"
        );

        option.value = customer.id;

        option.textContent = customer.name;

        select.appendChild(option);
    });
}

//------------------------------------------------------
// RENDER CUSTOMERS
//------------------------------------------------------

function renderCustomers(search = "") {
    const list = document.getElementById(
        "customer-list"
    );

    if (!list) return;

    const keyword = search
        .trim()
        .toLowerCase();

    const customers = getCustomers();

    const filtered = customers.filter(
        customer => {
            return (
                customer.name
                    .toLowerCase()
                    .includes(keyword) ||

                (customer.phone || "")
                    .toLowerCase()
                    .includes(keyword) ||

                (customer.notes || "")
                    .toLowerCase()
                    .includes(keyword)
            );
        }
    );

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

    list.innerHTML = filtered.map(
        customer => `
            <tr>

                <td>
                    <strong>
                        ${customer.name}
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
                        class="danger-btn delete-customer"
                        data-id="${customer.id}">

                        Delete

                    </button>

                </td>

            </tr>
        `
    ).join("");

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

//------------------------------------------------------
// DELETE CUSTOMER
//------------------------------------------------------

function deleteCustomer(id) {
    let customers = getCustomers();

    const customer = customers.find(
        item => item.id === id
    );

    if (!customer) return;

    const customerCredits = getCreditSales()
        .filter(
            credit =>
                credit.customerId === id &&
                Number(credit.balance) > 0
        );

    if (customerCredits.length) {
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

    customers = customers.filter(
        item => item.id !== id
    );

    saveCustomers(customers);

    renderCustomers();

    populateCustomerDropdown();

    updateCustomerSummary();
}

//------------------------------------------------------
// SAVE CREDIT SALE
//------------------------------------------------------

function saveCreditSale() {
    const customerId = document
        .getElementById(
            "credit-customer"
        )
        .value;

    const description = document
        .getElementById(
            "credit-description"
        )
        .value
        .trim();

    const amount = Number(
        document.getElementById(
            "credit-amount"
        ).value
    );

    const paid = Number(
        document.getElementById(
            "credit-paid-amount"
        ).value || 0
    );

    const dateInput = document.getElementById(
        "credit-date"
    );

    if (!customerId || amount <= 0) {
        alert(
            "Select a customer and enter the credit amount."
        );

        return;
    }

    if (paid < 0 || paid > amount) {
        alert(
            "Amount paid cannot be more than the credit amount."
        );

        return;
    }

    const customer = getCustomers()
        .find(
            item =>
                item.id === customerId
        );

    if (!customer) {
        alert(
            "Customer not found."
        );

        return;
    }

    const credits = getCreditSales();

    credits.unshift({
        id: generateId("CR-"),

        customerId,

        customerName:
            customer.name,

        description,

        amount,

        paid,

        balance:
            amount - paid,

        date:
            dateInput &&
            dateInput.value

                ? new Date(
                    dateInput.value
                ).toISOString()

                : new Date()
                    .toISOString()
    });

    saveCreditSales(credits);

    renderCreditSales();

    updateCustomerSummary();

    document
        .getElementById(
            "credit-form"
        )
        .reset();
}

//------------------------------------------------------
// RENDER CREDIT SALES
//------------------------------------------------------

function renderCreditSales() {
    const list = document.getElementById(
        "credit-list"
    );

    if (!list) return;

    const credits = getCreditSales();

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

    list.innerHTML = credits.map(
        credit => `
            <tr>

                <td>
                    ${formatDate(
                        credit.date
                    )}
                </td>

                <td>
                    ${credit.customerName}
                </td>

                <td>
                    ${credit.description || "-"}
                </td>

                <td>
                    ${formatCurrency(
                        credit.amount
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        credit.paid
                    )}
                </td>

                <td>
                    <strong>
                        ${formatCurrency(
                            credit.balance
                        )}
                    </strong>
                </td>

                <td>

                    ${
                        credit.balance > 0

                        ? `
                            <button
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
                        class="danger-btn delete-credit"
                        data-id="${credit.id}">

                        Delete

                    </button>

                </td>

            </tr>
        `
    ).join("");

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

//------------------------------------------------------
// RECORD PAYMENT
//------------------------------------------------------

function recordCreditPayment(id) {
    const credits = getCreditSales();

    const credit = credits.find(
        item => item.id === id
    );

    if (!credit) return;

    const payment = Number(
        prompt(
            `Outstanding balance: ${formatCurrency(
                credit.balance
            )}\n\nEnter payment amount:`
        )
    );

    if (
        !payment ||
        payment <= 0
    ) {
        return;
    }

    if (
        payment >
        Number(credit.balance)
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
        Number(
            credit.amount
        ) -
        credit.paid;

    saveCreditSales(
        credits
    );

    renderCreditSales();

    updateCustomerSummary();
}

//------------------------------------------------------
// DELETE CREDIT
//------------------------------------------------------

function deleteCreditSale(id) {
    let credits = getCreditSales();

    const credit = credits.find(
        item => item.id === id
    );

    if (!credit) return;

    if (
        !confirm(
            `Delete credit record for "${credit.customerName}"?`
        )
    ) {
        return;
    }

    credits = credits.filter(
        item => item.id !== id
    );

    saveCreditSales(
        credits
    );

    renderCreditSales();

    updateCustomerSummary();
}

//------------------------------------------------------
// SUMMARY
//------------------------------------------------------

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

    document.getElementById(
        "customer-count"
    ).textContent =
        customers.length;

    document.getElementById(
        "credit-total"
    ).textContent =
        formatCurrency(
            totalCredit
        );

    document.getElementById(
        "credit-paid"
    ).textContent =
        formatCurrency(
            totalPaid
        );

    document.getElementById(
        "credit-balance"
    ).textContent =
        formatCurrency(
            totalBalance
        );
}

//------------------------------------------------------
// SEARCH
//------------------------------------------------------

function initializeCustomerSearch() {
    const search =
        document.getElementById(
            "customer-search"
        );

    if (!search) return;

    search.addEventListener(
        "input",
        () => {

            renderCustomers(
                search.value
            );

        }
    );

    const clear =
        document.getElementById(
            "clear-customer-search"
        );

    if (clear) {

        clear.addEventListener(
            "click",
            () => {

                search.value = "";

                renderCustomers();

            }
        );

    }
}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeCustomersModule() {

    renderCustomers();

    populateCustomerDropdown();

    renderCreditSales();

    updateCustomerSummary();

    initializeCustomerSearch();

    const customerForm =
        document.getElementById("customer-form");

    if (
        customerForm &&
        !customerForm.dataset.ready
    ) {

        customerForm.dataset.ready = "true";

        customerForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                saveCustomer();

            }
        );

    }

    const creditForm =
        document.getElementById("credit-form");

    if (
        creditForm &&
        !creditForm.dataset.ready
    ) {

        creditForm.dataset.ready = "true";

        creditForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                saveCreditSale();

            }
        );

    }

}

//------------------------------------------------------
// START CUSTOMERS MODULE
//------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    initializeCustomersModule
);