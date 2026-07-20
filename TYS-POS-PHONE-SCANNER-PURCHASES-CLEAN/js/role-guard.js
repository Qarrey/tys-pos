//======================================================
// TYS POS
// SAFE PAGE ROLE GUARD
//======================================================

async function protectByRole() {
    const currentPage =
        window.location.pathname
            .split("/")
            .pop() || "index.html";

    const cashierAllowedPages = new Set([
        "",
        "index.html",
        "purchases.html",
        "register.html"
    ]);

    try {
        //--------------------------------------------------
        // CONFIRM AUTH SESSION FIRST
        //--------------------------------------------------

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error(
                "Could not confirm session:",
                error
            );

            return false;
        }

        if (!data.session) {
            window.location.replace(
                "login.html"
            );

            return false;
        }

        //--------------------------------------------------
        // LOAD CONFIRMED PROFILE
        //--------------------------------------------------

        let profile = null;

        if (
            typeof loadCurrentPOSUser ===
            "function"
        ) {
            profile =
                await loadCurrentPOSUser(
                    true
                );
        }

        /*
         * Do not redirect back and forth when the
         * session exists but the profile failed to load.
         */
        if (
            !profile ||
            profile.confirmed !== true
        ) {
            console.error(
                "The user is logged in, but the POS profile could not be confirmed."
            );

            document.body.innerHTML = `
                <main class="panel" style="max-width:600px;margin:40px auto;">
                    <div class="inventory-card">
                        <h2>Profile could not be loaded</h2>

                        <p>
                            Your login session is active, but your POS
                            profile could not be confirmed.
                        </p>

                        <button
                            id="retry-profile-btn"
                            class="primary-btn"
                            type="button">
                            Retry
                        </button>

                        <button
                            id="profile-logout-btn"
                            class="secondary-btn"
                            type="button">
                            Log Out
                        </button>
                    </div>
                </main>
            `;

            document
                .getElementById(
                    "retry-profile-btn"
                )
                ?.addEventListener(
                    "click",
                    () => {
                        location.reload();
                    }
                );

            document
                .getElementById(
                    "profile-logout-btn"
                )
                ?.addEventListener(
                    "click",
                    async () => {
                        await supabaseClient
                            .auth
                            .signOut();

                        window.location.replace(
                            "login.html"
                        );
                    }
                );

            return false;
        }

        //--------------------------------------------------
        // BLOCK INACTIVE USERS
        //--------------------------------------------------

        if (
            String(profile.status)
                .toLowerCase() !==
            "active"
        ) {
            await supabaseClient.auth.signOut();

            window.location.replace(
                "login.html"
            );

            return false;
        }

        //--------------------------------------------------
        // PAGE ACCESS
        //--------------------------------------------------

        const isAdmin =
            window.isConfirmedAdmin === true;

        const adminOnlyPage =
            document.body
                ?.hasAttribute(
                    "data-admin-page"
                );

        const cashierCanOpen =
            cashierAllowedPages.has(
                currentPage
            );

        if (
            !isAdmin &&
            (
                adminOnlyPage ||
                !cashierCanOpen
            )
        ) {
            window.location.replace(
                "index.html"
            );

            return false;
        }

        document.documentElement
            .classList
            .add(
                "page-access-confirmed"
            );

        return true;

    } catch (error) {
        console.error(
            "Role guard failed:",
            error
        );

        return false;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    protectByRole,
    {
        once: true
    }
);