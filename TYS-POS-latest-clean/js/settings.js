//======================================================
// TYS POS v3
// SETTINGS MODULE
// LOCAL + SUPABASE
//======================================================

const SETTINGS_KEY =
    "tys-pos-settings";


const DEFAULT_SETTINGS = {

    storeName:
        "TYS General Store",

    phone:
        "",

    address:
        "",

    currency:
        "KSh",

    lowStockLevel:
        5,

    receiptFooter:
        "Thank you for shopping!"

};


//======================================================
// GET SETTINGS
//======================================================

function getSettings() {
    try {
        return {

            ...DEFAULT_SETTINGS,

            ...(
                JSON.parse(
                    localStorage.getItem(
                        SETTINGS_KEY
                    )
                ) || {}
            )

        };

    } catch (error) {

        console.error(
            "Could not load settings:",
            error
        );

        return {
            ...DEFAULT_SETTINGS
        };
    }
}


//======================================================
// SAVE SETTINGS LOCALLY
//======================================================

function saveSettings(settings) {
    localStorage.setItem(

        SETTINGS_KEY,

        JSON.stringify(
            settings
        )

    );
}


//======================================================
// LOAD SETTINGS INTO FORM
//======================================================

function loadSettingsForm() {
    const settings =
        getSettings();


    const storeName =
        document.getElementById(
            "setting-store-name"
        );

    const phone =
        document.getElementById(
            "setting-phone"
        );

    const address =
        document.getElementById(
            "setting-address"
        );

    const currency =
        document.getElementById(
            "setting-currency"
        );

    const lowStock =
        document.getElementById(
            "setting-low-stock"
        );

    const receiptFooter =
        document.getElementById(
            "setting-receipt-footer"
        );


    if (storeName) {

        storeName.value =
            settings.storeName;

    }


    if (phone) {

        phone.value =
            settings.phone;

    }


    if (address) {

        address.value =
            settings.address;

    }


    if (currency) {

        currency.value =
            settings.currency;

    }


    if (lowStock) {

        lowStock.value =
            settings.lowStockLevel;

    }


    if (receiptFooter) {

        receiptFooter.value =
            settings.receiptFooter;

    }
}


//======================================================
// SAVE SETTINGS FORM
//======================================================

async function saveSettingsForm() {

    const settings = {

        storeName:

            document
                .getElementById(
                    "setting-store-name"
                )
                .value
                .trim() ||

            "TYS General Store",


        phone:

            document
                .getElementById(
                    "setting-phone"
                )
                .value
                .trim(),


        address:

            document
                .getElementById(
                    "setting-address"
                )
                .value
                .trim(),


        currency:

            document
                .getElementById(
                    "setting-currency"
                )
                .value
                .trim() ||

            "KSh",


        lowStockLevel:

            Number(

                document
                    .getElementById(
                        "setting-low-stock"
                    )
                    .value

            ) || 5,


        receiptFooter:

            document
                .getElementById(
                    "setting-receipt-footer"
                )
                .value
                .trim() ||

            "Thank you for shopping!"

    };


    //--------------------------------------------------
    // SAVE LOCALLY
    //--------------------------------------------------

    saveSettings(
        settings
    );


    //--------------------------------------------------
    // SAVE TO SUPABASE
    //--------------------------------------------------

    if (
        typeof saveSettingsToSupabase ===
        "function"
    ) {

        try {

            const cloudSettings =

                await saveSettingsToSupabase(

                    settings

                );


            if (!cloudSettings) {

                return;

            }


            saveSettings(

                cloudSettings

            );


            loadSettingsForm();


            console.log(

                "Settings saved locally and online."

            );


        } catch (error) {

            console.error(

                "Cloud settings save failed:",

                error

            );


            alert(

                "Settings were saved on this device but not online."

            );


            return;

        }

    }


    alert(

        "Settings saved."

    );

}


//======================================================
// RESET SETTINGS
//======================================================

async function resetSettings() {

    const confirmed =

        confirm(

            "Reset store settings to the default values?"

        );


    if (!confirmed) {

        return;

    }


    const settings = {

        ...DEFAULT_SETTINGS

    };


    saveSettings(

        settings

    );


    loadSettingsForm();


    //--------------------------------------------------
    // RESET ONLINE SETTINGS
    //--------------------------------------------------

    if (

        typeof saveSettingsToSupabase ===

        "function"

    ) {

        try {

            const cloudSettings =

                await saveSettingsToSupabase(

                    settings

                );


            if (

                cloudSettings

            ) {

                saveSettings(

                    cloudSettings

                );


                loadSettingsForm();

            }


        } catch (error) {

            console.error(

                "Could not reset cloud settings:",

                error

            );


            alert(

                "Settings were reset on this device but not online."

            );


            return;

        }

    }


    alert(

        "Settings reset."

    );

}


//======================================================
// INITIALIZE
//======================================================

function initializeSettings() {

    loadSettingsForm();


    const form =

        document.getElementById(

            "settings-form"

        );


    if (

        form &&

        !form.dataset.ready

    ) {

        form.dataset.ready =

            "true";


        form.addEventListener(

            "submit",

            event => {

                event.preventDefault();


                saveSettingsForm();

            }

        );

    }


    const resetButton =

        document.getElementById(

            "reset-settings-btn"

        );


    if (

        resetButton &&

        !resetButton.dataset.ready

    ) {

        resetButton.dataset.ready =

            "true";


        resetButton.addEventListener(

            "click",

            resetSettings

        );

    }

}


//======================================================
// AUTO START
//======================================================

document.addEventListener(

    "DOMContentLoaded",

    initializeSettings

);