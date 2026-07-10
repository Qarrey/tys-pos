//======================================================
// TYS POS v3
// SETTINGS MODULE
//======================================================

const SETTINGS_KEY = "tys-pos-settings";

const DEFAULT_SETTINGS = {
    storeName: "TYS General Store",
    phone: "",
    address: "",
    currency: "KSh",
    lowStockLevel: 5,
    receiptFooter: "Thank you for shopping!"
};

//------------------------------------------------------
// GET SETTINGS
//------------------------------------------------------

function getSettings() {
    try {
        return {
            ...DEFAULT_SETTINGS,
            ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {})
        };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

//------------------------------------------------------
// SAVE SETTINGS
//------------------------------------------------------

function saveSettings(settings) {
    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
    );
}

//------------------------------------------------------
// LOAD SETTINGS INTO FORM
//------------------------------------------------------

function loadSettingsForm() {
    const settings = getSettings();

    document.getElementById("setting-store-name").value = settings.storeName;
    document.getElementById("setting-phone").value = settings.phone;
    document.getElementById("setting-address").value = settings.address;
    document.getElementById("setting-currency").value = settings.currency;
    document.getElementById("setting-low-stock").value = settings.lowStockLevel;
    document.getElementById("setting-receipt-footer").value = settings.receiptFooter;
}

//------------------------------------------------------
// SAVE FORM
//------------------------------------------------------

function saveSettingsForm() {
    const settings = {
        storeName: document.getElementById("setting-store-name").value.trim(),
        phone: document.getElementById("setting-phone").value.trim(),
        address: document.getElementById("setting-address").value.trim(),
        currency: document.getElementById("setting-currency").value.trim() || "KSh",
        lowStockLevel: Number(document.getElementById("setting-low-stock").value) || 5,
        receiptFooter: document.getElementById("setting-receipt-footer").value.trim()
    };

    saveSettings(settings);

    alert("Settings saved.");
}

//------------------------------------------------------
// RESET SETTINGS
//------------------------------------------------------

function resetSettings() {
    saveSettings(DEFAULT_SETTINGS);
    loadSettingsForm();
    alert("Settings reset.");
}

//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

function initializeSettings() {
    loadSettingsForm();

    const form = document.getElementById("settings-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveSettingsForm();
        });
    }

    const resetButton = document.getElementById("reset-settings-btn");

    if (resetButton) {
        resetButton.addEventListener("click", resetSettings);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeSettings();
});