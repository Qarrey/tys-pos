//======================================================
// TYS POS
// CONFIRMED USER SESSION AND ROLE
//======================================================

window.currentPOSUser = window.currentPOSUser || null;
window.isConfirmedAdmin = false;
window.posUserReady = null;

function normalizePOSRole(role) {
    return String(role || "cashier").trim().toLowerCase();
}

function normalizePOSStatus(status) {
    return String(status || "active").trim().toLowerCase();
}

async function fetchCurrentPOSUser() {
    if (typeof supabaseClient === "undefined") {
        console.error("Supabase client is unavailable.");
        window.currentPOSUser = null;
        window.isConfirmedAdmin = false;
        return null;
    }

    const { data: authData, error: authError } =
        await supabaseClient.auth.getUser();

    if (authError || !authData.user) {
        window.currentPOSUser = null;
        window.isConfirmedAdmin = false;
        return null;
    }

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("id, full_name, role, status")
            .eq("id", authData.user.id)
            .maybeSingle();

    if (profileError || !profile) {
        console.error("Could not load confirmed POS profile:", profileError);
        window.currentPOSUser = {
            id: authData.user.id,
            email: authData.user.email || "",
            fullName: authData.user.email || "User",
            role: "cashier",
            status: "inactive",
            confirmed: false
        };
        window.isConfirmedAdmin = false;
        return window.currentPOSUser;
    }

    window.currentPOSUser = {
        id: profile.id,
        email: authData.user.email || "",
        fullName: profile.full_name || authData.user.email || "User",
        role: normalizePOSRole(profile.role),
        status: normalizePOSStatus(profile.status),
        confirmed: true
    };

    window.isConfirmedAdmin =
        window.currentPOSUser.confirmed === true &&
        window.currentPOSUser.status === "active" &&
        window.currentPOSUser.role === "admin";

    return window.currentPOSUser;
}

async function loadCurrentPOSUser(forceRefresh = false) {
    if (!forceRefresh && window.posUserReady) {
        return window.posUserReady;
    }

    window.posUserReady = fetchCurrentPOSUser().catch(error => {
        console.error("POS user loading failed:", error);
        window.currentPOSUser = null;
        window.isConfirmedAdmin = false;
        return null;
    });

    return window.posUserReady;
}

function isAdmin() {
    return window.isConfirmedAdmin === true;
}

function isCashier() {
    return Boolean(
        window.currentPOSUser &&
        window.currentPOSUser.confirmed === true &&
        window.currentPOSUser.status === "active" &&
        window.currentPOSUser.role === "cashier"
    );
}
