//======================================================
// TYS POS
// CONFIRMED USER SESSION AND ROLE
//======================================================

window.currentPOSUser = null;
window.isConfirmedAdmin = false;
window.posUserReady = null;
window.posSessionState = "idle";


//======================================================
// NORMALIZERS
//======================================================

function normalizePOSRole(role) {
    return String(
        role || "cashier"
    )
        .trim()
        .toLowerCase();
}


//======================================================
// CLEAR SESSION STATE
//======================================================

function clearPOSUserState() {
    window.currentPOSUser = null;
    window.isConfirmedAdmin = false;
    window.posUserReady = null;
    window.posSessionState = "signed-out";
}


//======================================================
// LOAD CURRENT USER FROM SUPABASE
//======================================================

async function fetchCurrentPOSUser() {
    if (
        typeof supabaseClient ===
        "undefined"
    ) {
        console.error(
            "Supabase client is unavailable."
        );

        clearPOSUserState();

        return null;
    }

    window.posSessionState =
        "loading";

    try {
        //--------------------------------------------------
        // GET AUTH SESSION
        //--------------------------------------------------

        const {
            data: sessionData,
            error: sessionError
        } = await supabaseClient
            .auth
            .getSession();

        if (sessionError) {
            console.error(
                "Could not read login session:",
                sessionError
            );

            clearPOSUserState();

            return null;
        }

        const session =
            sessionData.session;

        if (!session?.user) {
            clearPOSUserState();

            return null;
        }


        //--------------------------------------------------
        // GET POS PROFILE
        //
        // Your profiles table contains:
        // id, full_name, role, created_at
        //--------------------------------------------------

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select(
                "id, full_name, role"
            )
            .eq(
                "id",
                session.user.id
            )
            .maybeSingle();

        if (profileError) {
            console.error(
                "Could not load POS profile:",
                profileError
            );

            window.currentPOSUser = {
                id:
                    session.user.id,

                email:
                    session.user.email ||
                    "",

                fullName:
                    session.user.email ||
                    "User",

                role:
                    "cashier",

                status:
                    "unknown",

                confirmed:
                    false,

                profileError:
                    profileError.message ||
                    "Profile query failed"
            };

            window.isConfirmedAdmin =
                false;

            window.posSessionState =
                "profile-error";

            return window.currentPOSUser;
        }

        if (!profile) {
            console.error(
                "No POS profile exists for the logged-in account."
            );

            window.currentPOSUser = {
                id:
                    session.user.id,

                email:
                    session.user.email ||
                    "",

                fullName:
                    session.user.email ||
                    "User",

                role:
                    "cashier",

                status:
                    "unknown",

                confirmed:
                    false,

                profileError:
                    "No profile found"
            };

            window.isConfirmedAdmin =
                false;

            window.posSessionState =
                "profile-error";

            return window.currentPOSUser;
        }


        //--------------------------------------------------
        // BUILD CONFIRMED POS USER
        //--------------------------------------------------

        const role =
            normalizePOSRole(
                profile.role
            );

        /*
         * The profiles table has no status column.
         * Every valid profile is treated as active.
         */
        const status =
            "active";

        window.currentPOSUser = {
            id:
                profile.id,

            email:
                session.user.email ||
                "",

            fullName:
                profile.full_name ||
                session.user.email ||
                "User",

            role,

            status,

            confirmed:
                true
        };

        window.isConfirmedAdmin =
            role === "admin";

        window.posSessionState =
            "ready";


        //--------------------------------------------------
        // NOTIFY OTHER MODULES
        //--------------------------------------------------

        document.dispatchEvent(
            new CustomEvent(
                "pos-user-ready",
                {
                    detail: {
                        profile:
                            window.currentPOSUser,

                        isAdmin:
                            window.isConfirmedAdmin
                    }
                }
            )
        );

        return window.currentPOSUser;

    } catch (error) {
        console.error(
            "Unexpected POS user loading error:",
            error
        );

        clearPOSUserState();

        return null;
    }
}


//======================================================
// SHARED USER LOADER
//======================================================

async function loadCurrentPOSUser(
    forceRefresh = false
) {
    if (forceRefresh) {
        window.posUserReady = null;
    }

    if (!window.posUserReady) {
        window.posUserReady =
            fetchCurrentPOSUser()
                .catch(error => {
                    console.error(
                        "POS user loading failed:",
                        error
                    );

                    clearPOSUserState();

                    return null;
                });
    }

    return window.posUserReady;
}


//======================================================
// ROLE HELPERS
//======================================================

function isAdmin() {
    return (
        window.currentPOSUser?.confirmed ===
        true &&
        window.currentPOSUser?.role ===
        "admin"
    );
}


function isCashier() {
    return (
        window.currentPOSUser?.confirmed ===
        true &&
        window.currentPOSUser?.role ===
        "cashier"
    );
}


//======================================================
// SESSION STATE HELPERS
//======================================================

function isPOSUserReady() {
    return (
        window.posSessionState ===
        "ready"
    );
}


function hasConfirmedPOSUser() {
    return (
        window.currentPOSUser?.confirmed ===
        true
    );
}


//======================================================
// AUTH STATE CHANGES
//======================================================

if (
    typeof supabaseClient !==
    "undefined"
) {
    supabaseClient.auth.onAuthStateChange(
        (event, session) => {
            if (
                event === "SIGNED_OUT" ||
                !session
            ) {
                clearPOSUserState();
                return;
            }

            if (
                event === "SIGNED_IN" ||
                event === "TOKEN_REFRESHED" ||
                event === "USER_UPDATED"
            ) {
                loadCurrentPOSUser(
                    true
                );
            }
        }
    );
}