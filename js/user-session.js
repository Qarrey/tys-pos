//======================================================
// TYS POS
// CONFIRMED USER SESSION AND ROLE
//======================================================

window.currentPOSUser = null;
window.isConfirmedAdmin = false;
window.posUserReady = null;
window.posSessionState = "idle";

function normalizePOSRole(role) {
    return String(role || "cashier").trim().toLowerCase();
}

function normalizePOSStatus(status) {
    return String(status || "active").trim().toLowerCase();
}

function clearPOSUserState() {
    window.currentPOSUser = null;
    window.isConfirmedAdmin = false;
    window.posSessionState = "signed-out";
}

async function fetchCurrentPOSUser() {
    if (typeof supabaseClient === "undefined") {
        console.error("Supabase client is unavailable.");
        clearPOSUserState();
        return null;
    }

    window.posSessionState = "loading";

    const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

    if (sessionError) {
        console.error("Could not read login session:", sessionError);
        clearPOSUserState();
        return null;
    }

    const session = sessionData.session;

    if (!session?.user) {
        clearPOSUserState();
        return null;
    }

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("id, full_name, role, status")
            .eq("id", session.user.id)
            .maybeSingle();

    if (profileError) {
        console.error("Could not load POS profile:", profileError);
        window.currentPOSUser = {
            id: session.user.id,
            email: session.user.email || "",
            fullName: session.user.email || "User",
            role: "cashier",
            status: "unknown",
            confirmed: false,
            profileError: profileError.message || "Profile query failed"
        };
        window.isConfirmedAdmin = false;
        window.posSessionState = "profile-error";
        return window.currentPOSUser;
    }

    if (!profile) {
        console.error("No POS profile exists for the logged-in account.");
        window.currentPOSUser = {
            id: session.user.id,
            email: session.user.email || "",
            fullName: session.user.email || "User",
            role: "cashier",
            status: "unknown",
            confirmed: false,
            profileError: "No profile found"
        };
        window.isConfirmedAdmin = false;
        window.posSessionState = "profile-error";
        return window.currentPOSUser;
    }

    const role = normalizePOSRole(profile.role);
    const status = normalizePOSStatus(profile.status);

    window.currentPOSUser = {
        id: profile.id,
        email: session.user.email || "",
        fullName: profile.full_name || session.user.email || "User",
        role,
        status,
        confirmed: true
    };

    window.isConfirmedAdmin =
        status === "active" && role === "admin";

    window.posSessionState = "ready";

    document.dispatchEvent(new CustomEvent("pos-user-ready", {
        detail: {
            profile: window.currentPOSUser,
            isAdmin: window.isConfirmedAdmin
        }
    }));

    return window.currentPOSUser;
}

async function loadCurrentPOSUser(forceRefresh = false) {
    if (forceRefresh) {
        window.posUserReady = null;
    }

    if (!window.posUserReady) {
        window.posUserReady = fetchCurrentPOSUser().catch(error => {
            console.error("POS user loading failed:", error);
            clearPOSUserState();
            return null;
        });
    }

    return window.posUserReady;
}

function isAdmin() {
    return window.isConfirmedAdmin === true;
}

function isCashier() {
    return Boolean(
        window.currentPOSUser?.confirmed === true &&
        window.currentPOSUser?.status === "active" &&
        window.currentPOSUser?.role === "cashier"
    );
}
