//======================================================
// TYS POS
// DEDICATED CLOUD STOCKTAKE MODULE
//======================================================

let stocktakeRealtimeChannel = null;


//======================================================
// SAVE STOCKTAKE
//======================================================

async function saveStocktakeToSupabase(stocktake) {
    if (
        !stocktake ||
        !Array.isArray(stocktake.items) ||
        stocktake.items.length === 0
    ) {
        console.error("No stocktake items supplied.");
        return null;
    }

    console.log(
        "Sending stocktake to Supabase:",
        stocktake
    );

    try {
        //--------------------------------------------------
        // CONFIRM LOGIN
        //--------------------------------------------------

        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError) {
            throw sessionError;
        }

        if (!sessionData.session) {
            throw new Error(
                "You are not logged in."
            );
        }

        const userId =
            sessionData.session.user.id;


        //--------------------------------------------------
        // STOCKTAKE HEADER
        //--------------------------------------------------

        const {
            data: header,
            error: headerError
        } = await supabaseClient
            .from("stocktakes")
            .insert({
                created_by:
                    userId,

                created_by_name:
                    stocktake.countedBy ||
                    "Admin",

                counted_items:
                    Number(
                        stocktake.countedItems || 0
                    ),

                shortage_items:
                    Number(
                        stocktake.shortages || 0
                    ),

                extra_items:
                    Number(
                        stocktake.extraStock || 0
                    )
            })
            .select()
            .single();

        if (headerError) {
            throw new Error(
                `Stocktake header: ${headerError.message}`
            );
        }

        console.log(
            "Stocktake header saved:",
            header
        );


        //--------------------------------------------------
        // STOCKTAKE ITEMS
        //--------------------------------------------------

        const itemRows =
            stocktake.items.map(item => ({
                stocktake_id:
                    header.id,

                product_id:
                    item.productId,

                product_name:
                    item.productName ||
                    "Unknown Product",

                system_stock:
                    Number(
                        item.systemStock || 0
                    ),

                physical_stock:
                    Number(
                        item.physicalStock || 0
                    ),

                difference:
                    Number(
                        item.difference || 0
                    )
            }));

        const { error: itemError } =
            await supabaseClient
                .from("stocktake_items")
                .insert(itemRows);

        if (itemError) {
            await supabaseClient
                .from("stocktakes")
                .delete()
                .eq("id", header.id);

            throw new Error(
                `Stocktake items: ${itemError.message}`
            );
        }

        console.log(
            "Stocktake items saved:",
            itemRows
        );


        //--------------------------------------------------
        // UPDATE PRODUCTS
        //--------------------------------------------------

        for (const item of stocktake.items) {
            const {
                data: updatedProducts,
                error: productError
            } = await supabaseClient
                .from("products")
                .update({
                    stock:
                        Number(
                            item.physicalStock || 0
                        )
                })
                .eq(
                    "id",
                    item.productId
                )
                .select("id, stock");

            if (productError) {
                throw new Error(
                    `Product ${item.productName}: ${productError.message}`
                );
            }

            if (
                !updatedProducts ||
                updatedProducts.length === 0
            ) {
                throw new Error(
                    `No cloud product matched ${item.productName}.`
                );
            }


            //--------------------------------------------------
            // STOCK MOVEMENT
            //--------------------------------------------------

            if (
                Number(item.difference || 0) !== 0
            ) {
                const { error: movementError } =
                    await supabaseClient
                        .from("stock_movements")
                        .insert({
                            product_id:
                                item.productId,

                            product_name:
                                item.productName ||
                                "Unknown Product",

                            type:
                                "Stocktake",

                            quantity:
                                Number(
                                    item.difference || 0
                                ),

                            notes:
                                `Physical count changed stock from ${item.systemStock} to ${item.physicalStock}`
                        });

                if (movementError) {
                    console.warn(
                        "Stock movement was not saved:",
                        movementError
                    );
                }
            }
        }

        console.log(
            "Stocktake completed online:",
            header
        );

        return header;

    } catch (error) {
        console.error(
            "Stocktake cloud save failed:",
            error
        );

        alert(
            `Stocktake cloud save failed: ${
                error.message ||
                "Unknown error"
            }`
        );

        return null;
    }
}


//======================================================
// REALTIME PRODUCT REFRESH
//======================================================

function subscribeToStocktakeChanges() {
    if (stocktakeRealtimeChannel) {
        supabaseClient.removeChannel(
            stocktakeRealtimeChannel
        );
    }

    stocktakeRealtimeChannel =
        supabaseClient
            .channel(
                "tys-stocktake-only-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "stocktakes"
                },
                async () => {
                    if (
                        typeof syncCloudProductsToPOS ===
                        "function"
                    ) {
                        await syncCloudProductsToPOS();
                    }
                }
            )
            .subscribe(status => {
                console.log(
                    "Stocktake realtime:",
                    status
                );
            });
}


//======================================================
// INITIALIZE
//======================================================

async function initializeCloudStocktake() {
    if (
        typeof supabaseClient ===
        "undefined"
    ) {
        console.error(
            "Supabase client is unavailable."
        );

        return;
    }

    const { data, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error(
            "Could not read login session:",
            error
        );

        return;
    }

    if (!data.session) {
        console.warn(
            "No session. Stocktake cloud sync was not started."
        );

        return;
    }

    subscribeToStocktakeChanges();

    console.log(
        "cloud-stocktake.js initialized"
    );
}


document.addEventListener(
    "DOMContentLoaded",
    initializeCloudStocktake
);

console.log(
    "cloud-stocktake.js loaded"
);