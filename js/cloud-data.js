//======================================================
// TYS POS
// CENTRAL CLOUD DATA MODULE
//
// SYNCHRONIZES:
// - SUPPLIERS
// - EXPENSES
// - CUSTOMERS
// - CUSTOMER CREDIT
//======================================================

let suppliersCloudChannel = null;
let expensesCloudChannel = null;
let customersCloudChannel = null;
let creditsCloudChannel = null;


//======================================================
// SUPPLIERS
//======================================================

function mapCloudSupplier(supplier) {
    return {
        id: supplier.id,
        name: supplier.name || "",
        contact: supplier.contact || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        createdAt: supplier.created_at
    };
}

async function loadCloudSuppliers() {
    const { data, error } = await supabaseClient
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud suppliers:", error);
        return [];
    }

    return (data || []).map(mapCloudSupplier);
}

async function syncCloudSuppliersToPOS() {
    try {
        const cloudSuppliers = await loadCloudSuppliers();

        if (typeof saveSuppliers === "function") {
            saveSuppliers(cloudSuppliers);
        }

        if (typeof renderSuppliers === "function") {
            renderSuppliers();
        }

        if (typeof populateSupplierDropdown === "function") {
            populateSupplierDropdown();
        }

        if (typeof updateDashboardMetrics === "function") {
            updateDashboardMetrics();
        }

        console.log(
            `Loaded ${cloudSuppliers.length} suppliers from Supabase.`
        );

        return cloudSuppliers;

    } catch (error) {
        console.error("Supplier synchronization failed:", error);
        return [];
    }
}

async function saveSupplierToSupabase(supplier) {
    if (!supplier) {
        console.error("No supplier supplied.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("suppliers")
        .insert({
            name: supplier.name,
            contact: supplier.contact || null,
            phone: supplier.phone || null,
            email: supplier.email || null,
            address: supplier.address || null
        })
        .select()
        .single();

    if (error) {
        console.error("Could not save supplier online:", error);
        alert("Supplier was saved on this device but not online.");
        return null;
    }

    console.log("Supplier saved to Supabase:", data);

    return mapCloudSupplier(data);
}

async function deleteSupplierFromSupabase(supplierId) {
    if (!supplierId) return false;

    const { error } = await supabaseClient
        .from("suppliers")
        .delete()
        .eq("id", supplierId);

    if (error) {
        console.error("Could not delete cloud supplier:", error);
        alert("Supplier was not deleted online.");
        return false;
    }

    return true;
}

function subscribeToCloudSuppliers() {
    if (suppliersCloudChannel) {
        supabaseClient.removeChannel(suppliersCloudChannel);
    }

    suppliersCloudChannel = supabaseClient
        .channel("tys-suppliers-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "suppliers"
            },
            async () => {
                await syncCloudSuppliersToPOS();
            }
        )
        .subscribe(status => {
            console.log("Suppliers realtime:", status);
        });
}


//======================================================
// EXPENSES
//======================================================

function mapCloudExpense(expense) {
    return {
        id: expense.id,
        name: expense.name || "",
        category: expense.category || "",
        amount: Number(expense.amount || 0),
        notes: expense.notes || "",
        date: expense.expense_date || expense.created_at
    };
}

async function loadCloudExpenses() {
    const { data, error } = await supabaseClient
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud expenses:", error);
        return [];
    }

    return (data || []).map(mapCloudExpense);
}

async function syncCloudExpensesToPOS() {
    try {
        const cloudExpenses = await loadCloudExpenses();

        if (typeof saveExpenses === "function") {
            saveExpenses(cloudExpenses);
        }

        if (typeof renderExpenses === "function") {
            renderExpenses();
        }

        if (typeof updateExpenseSummary === "function") {
            updateExpenseSummary();
        }

        console.log(
            `Loaded ${cloudExpenses.length} expenses from Supabase.`
        );

        return cloudExpenses;

    } catch (error) {
        console.error("Expense synchronization failed:", error);
        return [];
    }
}

async function saveExpenseToSupabase(expense) {
    if (!expense) {
        console.error("No expense supplied.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("expenses")
        .insert({
            name: expense.name,
            category: expense.category || null,
            amount: Number(expense.amount || 0),
            notes: expense.notes || null,
            expense_date:
                expense.date || new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("Could not save expense online:", error);
        alert("Expense was saved on this device but not online.");
        return null;
    }

    console.log("Expense saved to Supabase:", data);

    return mapCloudExpense(data);
}

async function deleteExpenseFromSupabase(expenseId) {
    if (!expenseId) return false;

    const { error } = await supabaseClient
        .from("expenses")
        .delete()
        .eq("id", expenseId);

    if (error) {
        console.error("Could not delete cloud expense:", error);
        alert("Expense was not deleted online.");
        return false;
    }

    return true;
}

function subscribeToCloudExpenses() {
    if (expensesCloudChannel) {
        supabaseClient.removeChannel(expensesCloudChannel);
    }

    expensesCloudChannel = supabaseClient
        .channel("tys-expenses-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "expenses"
            },
            async () => {
                await syncCloudExpensesToPOS();
            }
        )
        .subscribe(status => {
            console.log("Expenses realtime:", status);
        });
}


//======================================================
// CUSTOMERS
//======================================================

function mapCloudCustomer(customer) {
    return {
        id: customer.id,
        name: customer.name || "",
        phone: customer.phone || "",
        notes: customer.notes || "",
        createdAt: customer.created_at
    };
}

async function loadCloudCustomers() {
    const { data, error } = await supabaseClient
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load cloud customers:", error);
        return [];
    }

    return (data || []).map(mapCloudCustomer);
}

async function syncCloudCustomersToPOS() {
    try {
        const cloudCustomers = await loadCloudCustomers();

        if (typeof saveCustomers === "function") {
            saveCustomers(cloudCustomers);
        }

        if (typeof renderCustomers === "function") {
            renderCustomers();
        }

        if (typeof populateCustomerDropdown === "function") {
            populateCustomerDropdown();
        }

        if (typeof updateCustomerSummary === "function") {
            updateCustomerSummary();
        }

        console.log(
            `Loaded ${cloudCustomers.length} customers from Supabase.`
        );

        return cloudCustomers;

    } catch (error) {
        console.error("Customer synchronization failed:", error);
        return [];
    }
}

async function saveCustomerToSupabase(customer) {
    if (!customer) {
        console.error("No customer supplied.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("customers")
        .insert({
            name: customer.name,
            phone: customer.phone || null,
            notes: customer.notes || null
        })
        .select()
        .single();

    if (error) {
        console.error("Could not save customer online:", error);
        alert("Customer was not saved online.");
        return null;
    }

    return mapCloudCustomer(data);
}

async function deleteCustomerFromSupabase(customerId) {
    if (!customerId) return false;

    const { error } = await supabaseClient
        .from("customers")
        .delete()
        .eq("id", customerId);

    if (error) {
        console.error("Could not delete cloud customer:", error);
        alert("Customer was not deleted online.");
        return false;
    }

    return true;
}

function subscribeToCloudCustomers() {
    if (customersCloudChannel) {
        supabaseClient.removeChannel(customersCloudChannel);
    }

    customersCloudChannel = supabaseClient
        .channel("tys-customers-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "customers"
            },
            async () => {
                await syncCloudCustomersToPOS();
            }
        )
        .subscribe(status => {
            console.log("Customers realtime:", status);
        });
}


//======================================================
// CUSTOMER CREDIT
//======================================================

function mapCloudCredit(credit) {
    return {
        id: credit.id,
        customerId: credit.customer_id,
        customerName: credit.customer_name || "",
        description: credit.description || "",
        amount: Number(credit.amount || 0),
        paid: Number(credit.paid || 0),
        balance: Number(credit.balance || 0),
        date: credit.sale_date || credit.created_at
    };
}

async function loadCloudCreditSales() {
    const { data, error } = await supabaseClient
        .from("credit_sales")
        .select("*")
        .order("sale_date", { ascending: false });

    if (error) {
        console.error("Could not load cloud credit sales:", error);
        return [];
    }

    return (data || []).map(mapCloudCredit);
}

async function syncCloudCreditSalesToPOS() {
    try {
        const cloudCredits = await loadCloudCreditSales();

        if (typeof saveCreditSales === "function") {
            saveCreditSales(cloudCredits);
        }

        if (typeof renderCreditSales === "function") {
            renderCreditSales();
        }

        if (typeof updateCustomerSummary === "function") {
            updateCustomerSummary();
        }

        console.log(
            `Loaded ${cloudCredits.length} credit records from Supabase.`
        );

        return cloudCredits;

    } catch (error) {
        console.error("Credit synchronization failed:", error);
        return [];
    }
}

async function saveCreditSaleToSupabase(credit) {
    if (!credit) {
        console.error("No credit record supplied.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("credit_sales")
        .insert({
            customer_id: credit.customerId,
            customer_name: credit.customerName,
            description: credit.description || null,
            amount: Number(credit.amount || 0),
            paid: Number(credit.paid || 0),
            balance: Number(credit.balance || 0),
            sale_date:
                credit.date || new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("Could not save credit sale online:", error);
        alert("Credit sale was not saved online.");
        return null;
    }

    return mapCloudCredit(data);
}

async function updateCreditSaleInSupabase(credit) {
    if (!credit || !credit.id) return false;

    const { error } = await supabaseClient
        .from("credit_sales")
        .update({
            paid: Number(credit.paid || 0),
            balance: Number(credit.balance || 0)
        })
        .eq("id", credit.id);

    if (error) {
        console.error("Could not update credit online:", error);
        alert("Credit payment was not updated online.");
        return false;
    }

    return true;
}

async function deleteCreditSaleFromSupabase(creditId) {
    if (!creditId) return false;

    const { error } = await supabaseClient
        .from("credit_sales")
        .delete()
        .eq("id", creditId);

    if (error) {
        console.error("Could not delete credit online:", error);
        alert("Credit record was not deleted online.");
        return false;
    }

    return true;
}

function subscribeToCloudCreditSales() {
    if (creditsCloudChannel) {
        supabaseClient.removeChannel(creditsCloudChannel);
    }

    creditsCloudChannel = supabaseClient
        .channel("tys-credit-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "credit_sales"
            },
            async () => {
                await syncCloudCreditSalesToPOS();
            }
        )
        .subscribe(status => {
            console.log("Credit realtime:", status);
        });
}

//======================================================
// CATEGORIES
//======================================================

let categoriesCloudChannel = null;


//------------------------------------------------------
// MAP CLOUD CATEGORY
//------------------------------------------------------

function mapCloudCategory(category) {
    return {
        id: category.id,
        name: category.name || "",
        description: category.description || "",
        createdAt: category.created_at
    };
}


//------------------------------------------------------
// LOAD CLOUD CATEGORIES
//------------------------------------------------------

async function loadCloudCategories() {
    const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    if (error) {
        console.error(
            "Could not load cloud categories:",
            error
        );

        return [];
    }

    return (data || []).map(
        mapCloudCategory
    );
}


//------------------------------------------------------
// COPY CLOUD CATEGORIES INTO POS
//------------------------------------------------------

async function syncCloudCategoriesToPOS() {
    try {
        const cloudCategories =
            await loadCloudCategories();

        if (
            typeof saveCategories ===
            "function"
        ) {
            saveCategories(
                cloudCategories
            );
        }

        if (
            typeof renderCategories ===
            "function"
        ) {
            renderCategories();
        }

        console.log(
            `Loaded ${cloudCategories.length} categories from Supabase.`
        );

        return cloudCategories;

    } catch (error) {
        console.error(
            "Category synchronization failed:",
            error
        );

        return [];
    }
}


//------------------------------------------------------
// SAVE CATEGORY ONLINE
//------------------------------------------------------

async function saveCategoryToSupabase(
    category
) {
    if (!category) {
        console.error(
            "No category supplied."
        );

        return null;
    }

    const { data, error } =
        await supabaseClient
            .from("categories")
            .insert({
                name:
                    category.name,

                description:
                    category.description ||
                    null
            })
            .select()
            .single();

    if (error) {
        console.error(
            "Could not save category online:",
            error
        );

        alert(
            "Category was saved on this device but not online."
        );

        return null;
    }

    console.log(
        "Category saved to Supabase:",
        data
    );

    return mapCloudCategory(data);
}


//------------------------------------------------------
// DELETE CATEGORY ONLINE
//------------------------------------------------------

async function deleteCategoryFromSupabase(
    categoryId
) {
    if (!categoryId) {
        return false;
    }

    const { error } =
        await supabaseClient
            .from("categories")
            .delete()
            .eq(
                "id",
                categoryId
            );

    if (error) {
        console.error(
            "Could not delete cloud category:",
            error
        );

        alert(
            "Category was not deleted online."
        );

        return false;
    }

    return true;
}


//------------------------------------------------------
// CATEGORY REALTIME
//------------------------------------------------------

function subscribeToCloudCategories() {
    if (categoriesCloudChannel) {
        supabaseClient.removeChannel(
            categoriesCloudChannel
        );
    }

    categoriesCloudChannel =
        supabaseClient
            .channel(
                "tys-categories-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "categories"
                },
                async () => {
                    await syncCloudCategoriesToPOS();
                }
            )
            .subscribe(status => {
                console.log(
                    "Categories realtime:",
                    status
                );
            });
}


//======================================================
// SETTINGS
//======================================================

let settingsCloudChannel = null;


//------------------------------------------------------
// MAP CLOUD SETTINGS
//------------------------------------------------------

function mapCloudSettings(settings) {
    return {
        storeName:
            settings.store_name ||
            "TYS General Store",

        phone:
            settings.phone || "",

        address:
            settings.address || "",

        currency:
            settings.currency ||
            "KSh",

        lowStockLevel:
            Number(
                settings.low_stock_level ||
                5
            ),

        receiptFooter:
            settings.receipt_footer ||
            "Thank you for shopping!"
    };
}


//------------------------------------------------------
// LOAD CLOUD SETTINGS
//------------------------------------------------------

async function loadCloudSettings() {
    const { data, error } =
        await supabaseClient
            .from("pos_settings")
            .select("*")
            .eq(
                "id",
                "main"
            )
            .maybeSingle();

    if (error) {
        console.error(
            "Could not load cloud settings:",
            error
        );

        return null;
    }

    if (!data) {
        return null;
    }

    return mapCloudSettings(
        data
    );
}


//------------------------------------------------------
// COPY CLOUD SETTINGS INTO POS
//------------------------------------------------------

async function syncCloudSettingsToPOS() {
    try {
        const cloudSettings =
            await loadCloudSettings();

        if (!cloudSettings) {
            return null;
        }

        if (
            typeof saveSettings ===
            "function"
        ) {
            saveSettings(
                cloudSettings
            );
        }

        if (
            typeof loadSettingsForm ===
            "function"
        ) {
            loadSettingsForm();
        }

        console.log(
            "POS settings loaded from Supabase."
        );

        return cloudSettings;

    } catch (error) {
        console.error(
            "Settings synchronization failed:",
            error
        );

        return null;
    }
}


//------------------------------------------------------
// SAVE SETTINGS ONLINE
//------------------------------------------------------

async function saveSettingsToSupabase(
    settings
) {
    if (!settings) {
        console.error(
            "No settings supplied."
        );

        return null;
    }

    const { data, error } =
        await supabaseClient
            .from("pos_settings")
            .upsert(
                {
                    id:
                        "main",

                    store_name:
                        settings.storeName ||
                        "TYS General Store",

                    phone:
                        settings.phone ||
                        null,

                    address:
                        settings.address ||
                        null,

                    currency:
                        settings.currency ||
                        "KSh",

                    low_stock_level:
                        Number(
                            settings.lowStockLevel ||
                            5
                        ),

                    receipt_footer:
                        settings.receiptFooter ||
                        "Thank you for shopping!",

                    updated_at:
                        new Date()
                            .toISOString()
                },
                {
                    onConflict:
                        "id"
                }
            )
            .select()
            .single();

    if (error) {
        console.error(
            "Could not save settings online:",
            error
        );

        alert(
            "Settings were saved on this device but not online."
        );

        return null;
    }

    console.log(
        "Settings saved to Supabase:",
        data
    );

    return mapCloudSettings(
        data
    );
}


//------------------------------------------------------
// SETTINGS REALTIME
//------------------------------------------------------

function subscribeToCloudSettings() {
    if (settingsCloudChannel) {
        supabaseClient.removeChannel(
            settingsCloudChannel
        );
    }

    settingsCloudChannel =
        supabaseClient
            .channel(
                "tys-settings-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "pos_settings"
                },
                async () => {
                    await syncCloudSettingsToPOS();
                }
            )
            .subscribe(status => {
                console.log(
                    "Settings realtime:",
                    status
                );
            });
}
//======================================================
// CASH REGISTER
//======================================================

let registersCloudChannel = null;


//------------------------------------------------------
// MAP CLOUD REGISTER
//------------------------------------------------------

function mapCloudRegister(register) {
    return {
        id: register.id,

        cashierId:
            register.cashier_id || "",

        cashier:
            register.cashier_name || "Admin",

        openingCash:
            Number(register.opening_cash || 0),

        openedAt:
            register.opened_at,

        cashSales:
            Number(register.cash_sales || 0),

        expectedCash:
            Number(register.expected_cash || 0),

        actualCash:
            register.actual_cash === null
                ? null
                : Number(register.actual_cash),

        difference:
            register.difference === null
                ? null
                : Number(register.difference),

        notes:
            register.notes || "",

        closedAt:
            register.closed_at || null,

        status:
            register.status || "Open"
    };
}


//------------------------------------------------------
// LOAD CLOUD REGISTERS
//------------------------------------------------------

async function loadCloudRegisters() {
    const { data, error } = await supabaseClient
        .from("registers")
        .select("*")
        .order("opened_at", {
            ascending: false
        });

    if (error) {
        console.error(
            "Could not load cloud registers:",
            error
        );

        return [];
    }

    return (data || []).map(
        mapCloudRegister
    );
}


//------------------------------------------------------
// SYNC CLOUD REGISTERS INTO POS
//------------------------------------------------------

async function syncCloudRegistersToPOS() {
    try {
        const cloudRegisters =
            await loadCloudRegisters();

        const activeRegister =
            cloudRegisters.find(register => {
                return register.status === "Open";
            }) || null;

        const closedRegisters =
            cloudRegisters.filter(register => {
                return register.status !== "Open";
            });

        if (
            typeof saveRegisters ===
            "function"
        ) {
            saveRegisters(
                closedRegisters
            );
        }

        if (activeRegister) {
            if (
                typeof saveActiveRegister ===
                "function"
            ) {
                saveActiveRegister(
                    activeRegister
                );
            }
        } else if (
            typeof clearActiveRegister ===
            "function"
        ) {
            clearActiveRegister();
        }

        if (
            typeof renderRegisterDashboard ===
            "function"
        ) {
            renderRegisterDashboard();
        }

        if (
            typeof renderRegisterHistory ===
            "function"
        ) {
            renderRegisterHistory();
        }

        console.log(
            `Loaded ${cloudRegisters.length} registers from Supabase.`
        );

        return cloudRegisters;

    } catch (error) {
        console.error(
            "Register synchronization failed:",
            error
        );

        return [];
    }
}


//------------------------------------------------------
// OPEN REGISTER ONLINE
//------------------------------------------------------

async function openRegisterInSupabase(register) {
    if (!register) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from("registers")
        .insert({
            cashier_id:
                register.cashierId || null,

            cashier_name:
                register.cashier || "Admin",

            opening_cash:
                Number(register.openingCash || 0),

            opened_at:
                register.openedAt ||
                new Date().toISOString(),

            cash_sales:
                0,

            expected_cash:
                Number(register.openingCash || 0),

            status:
                "Open"
        })
        .select()
        .single();

    if (error) {
        console.error(
            "Could not open cloud register:",
            error
        );

        alert(
            "Register was opened on this device but not online."
        );

        return null;
    }

    return mapCloudRegister(data);
}


//------------------------------------------------------
// CLOSE REGISTER ONLINE
//------------------------------------------------------

async function closeRegisterInSupabase(register) {
    if (!register || !register.id) {
        return false;
    }

    const { error } = await supabaseClient
        .from("registers")
        .update({
            cash_sales:
                Number(register.cashSales || 0),

            expected_cash:
                Number(register.expectedCash || 0),

            actual_cash:
                Number(register.actualCash || 0),

            difference:
                Number(register.difference || 0),

            notes:
                register.notes || null,

            closed_at:
                register.closedAt ||
                new Date().toISOString(),

            status:
                "Closed"
        })
        .eq("id", register.id);

    if (error) {
        console.error(
            "Could not close cloud register:",
            error
        );

        alert(
            "Register was closed on this device but not updated online."
        );

        return false;
    }

    return true;
}


//------------------------------------------------------
// REGISTER REALTIME
//------------------------------------------------------

function subscribeToCloudRegisters() {
    if (registersCloudChannel) {
        supabaseClient.removeChannel(
            registersCloudChannel
        );
    }

    registersCloudChannel =
        supabaseClient
            .channel(
                "tys-registers-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "registers"
                },
                async () => {
                    await syncCloudRegistersToPOS();
                }
            )
            .subscribe(status => {
                console.log(
                    "Registers realtime:",
                    status
                );
            });
}
//======================================================
// STOCKTAKE
//======================================================

let stocktakesCloudChannel = null;


//------------------------------------------------------
// MAP CLOUD STOCKTAKE
//------------------------------------------------------

function mapCloudStocktake(stocktake) {
    return {
        id: stocktake.id,

        countedBy:
            stocktake.counted_by ||
            "Admin",

        countedItems:
            Number(
                stocktake.counted_items ||
                0
            ),

        shortages:
            Number(
                stocktake.shortages ||
                0
            ),

        extraStock:
            Number(
                stocktake.extra_stock ||
                0
            ),

        notes:
            stocktake.notes ||
            "",

        createdAt:
            stocktake.created_at
    };
}


//------------------------------------------------------
// LOAD STOCKTAKE HISTORY
//------------------------------------------------------

async function loadCloudStocktakes() {
    const { data, error } =
        await supabaseClient
            .from("stocktakes")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        console.error(
            "Could not load cloud stocktakes:",
            error
        );

        return [];
    }

    return (
        data || []
    ).map(
        mapCloudStocktake
    );
}


//------------------------------------------------------
// SAVE STOCKTAKE ONLINE
//------------------------------------------------------

async function saveStocktakeToSupabase(stocktake) {
    if (
        !stocktake ||
        !Array.isArray(stocktake.items) ||
        !stocktake.items.length
    ) {
        console.error("No stocktake items supplied.");
        return null;
    }

    //--------------------------------------------------
    // SAVE STOCKTAKE HEADER
    //--------------------------------------------------

    const { data: stocktakeData, error: stocktakeError } =
        await supabaseClient
            .from("stocktakes")
            .insert({
                created_by:
                    stocktake.countedById || null,

                created_by_name:
                    stocktake.countedBy || "Admin",

                counted_items:
                    Number(stocktake.countedItems || 0),

                shortage_items:
                    Number(stocktake.shortages || 0),

                extra_items:
                    Number(stocktake.extraStock || 0)
            })
            .select()
            .single();

    if (stocktakeError) {
        console.error(
            "Could not save stocktake:",
            stocktakeError
        );

        alert(
            `Stocktake was not saved online: ${
                stocktakeError.message || "Unknown error"
            }`
        );

        return null;
    }

    //--------------------------------------------------
    // SAVE STOCKTAKE ITEMS
    //--------------------------------------------------

    const stocktakeItems = stocktake.items.map(item => ({
        stocktake_id:
            stocktakeData.id,

        product_id:
            item.productId || null,

        product_name:
            item.productName || "Unknown Product",

        system_stock:
            Number(item.systemStock || 0),

        physical_stock:
            Number(item.physicalStock || 0),

        difference:
            Number(item.difference || 0)
    }));

    const { error: itemsError } =
        await supabaseClient
            .from("stocktake_items")
            .insert(stocktakeItems);

    if (itemsError) {
        console.error(
            "Could not save stocktake items:",
            itemsError
        );

        alert(
            `Stocktake header saved, but items failed: ${
                itemsError.message || "Unknown error"
            }`
        );

        return null;
    }

    //--------------------------------------------------
    // UPDATE PRODUCTS AND STOCK MOVEMENTS
    //--------------------------------------------------

    for (const item of stocktake.items) {
        const { error: productError } =
            await supabaseClient
                .from("products")
                .update({
                    stock:
                        Number(item.physicalStock || 0)
                })
                .eq(
                    "id",
                    item.productId
                );

        if (productError) {
            console.error(
                `Could not update stock for ${item.productName}:`,
                productError
            );
        }

        if (Number(item.difference || 0) !== 0) {
            const { error: movementError } =
                await supabaseClient
                    .from("stock_movements")
                    .insert({
                        product_id:
                            item.productId || null,

                        product_name:
                            item.productName ||
                            "Unknown Product",

                        type:
                            "Stocktake",

                        quantity:
                            Number(item.difference || 0),

                        notes:
                            `Physical count changed stock from ${item.systemStock} to ${item.physicalStock}`
                    });

            if (movementError) {
                console.error(
                    `Could not save stock movement for ${item.productName}:`,
                    movementError
                );
            }
        }
    }

    console.log(
        "Stocktake saved online successfully:",
        stocktakeData
    );

    return mapCloudStocktake(stocktakeData);
}

//------------------------------------------------------
// STOCKTAKE REALTIME
//------------------------------------------------------

function subscribeToCloudStocktakes() {
    if (
        stocktakesCloudChannel
    ) {
        supabaseClient
            .removeChannel(
                stocktakesCloudChannel
            );
    }


    stocktakesCloudChannel =
        supabaseClient
            .channel(
                "tys-stocktakes-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "stocktakes"
                },

                async () => {

                    //--------------------------------------------------
                    // REFRESH PRODUCTS ON OTHER DEVICES
                    //--------------------------------------------------

                    if (
                        typeof syncCloudProductsToPOS ===
                        "function"
                    ) {
                        await syncCloudProductsToPOS();
                    }

                }
            )
            .subscribe(
                status => {
                    console.log(
                        "Stocktakes realtime:",
                        status
                    );
                }
            );
}
//======================================================
// INITIALIZE CLOUD DATA
//======================================================

async function initializeCloudData() {
    if (typeof supabaseClient === "undefined") {
        console.error("Supabase client is unavailable.");
        return;
    }

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Could not read Supabase session:", error);
        return;
    }

    if (!data.session) {
        console.warn("No logged-in session. Cloud data was not loaded.");
        return;
    }

    await syncCloudSuppliersToPOS();
    subscribeToCloudSuppliers();

    await syncCloudExpensesToPOS();
    subscribeToCloudExpenses();

    await syncCloudCustomersToPOS();
    subscribeToCloudCustomers();

    await syncCloudCreditSalesToPOS();
    subscribeToCloudCreditSales();

    await syncCloudCategoriesToPOS();
    subscribeToCloudCategories();

    await syncCloudSettingsToPOS();
    subscribeToCloudSettings();

    await syncCloudRegistersToPOS();
    subscribeToCloudRegisters();

    console.log("TYS cloud data initialized.");
}


document.addEventListener(
    "DOMContentLoaded",
    initializeCloudData
);

console.log("cloud-data.js loaded");
