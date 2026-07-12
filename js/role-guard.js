//======================================================
// TYS POS
// SAFE PAGE ROLE GUARD
//======================================================

const CASHIER_ALLOWED_PAGES = new Set([
    "",
    "index.html",
    "purchases.html",
    "register.html"
]);

function showPOSAccessMessage(title, message) {
    document.body.style.visibility = "visible";
    document.body.innerHTML = `
        <main class="panel" style="max-width:640px;margin:40px auto;">
            <div class="inventory-card">
                <h2>${title}</h2>
                <p>${message}</p>
                <div class="form-actions">
                    <button id="pos-retry-btn" class="primary-btn" type="button">Retry</button>
                    <button id="pos-signout-btn" class="secondary-btn" type="button">Log Out</button>
                </div>
            </div>
        </main>
    `;

    document.getElementById("pos-retry-btn")?.addEventListener("click", () => {
        window.location.reload();
    });

    document.getElementById("pos-signout-btn")?.addEventListener("click", async () => {
        try {
            await supabaseClient.auth.signOut();
        } finally {
            redirectPOSOnce("login.html");
        }
    });
}

async function protectByRole() {
    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    const authOkay = window.posAuthReady
        ? await window.posAuthReady
        : await protectPageAuthentication();

    if (!authOkay) return false;

    const profile = typeof loadCurrentPOSUser === "function"
        ? await loadCurrentPOSUser()
        : null;

    if (!profile || profile.confirmed !== true) {
        showPOSAccessMessage(
            "Profile could not be loaded",
            "Your login is active, but the POS profile could not be confirmed. This page will not redirect repeatedly. Retry the profile check or log out."
        );
        return false;
    }

    if (profile.status !== "active") {
        showPOSAccessMessage(
            "Account is inactive",
            "This POS account is not active. Ask an administrator to activate it, then retry."
        );
        return false;
    }

    const isConfirmedAdmin = profile.role === "admin";
    const pageMarkedAdmin = document.body?.hasAttribute("data-admin-page");
    const cashierCanOpen = CASHIER_ALLOWED_PAGES.has(currentPage);

    if (!isConfirmedAdmin && (pageMarkedAdmin || !cashierCanOpen)) {
        redirectPOSOnce("index.html");
        return false;
    }

    document.documentElement.classList.add("page-access-confirmed");
    document.body.style.visibility = "visible";
    return true;
}

window.posRoleReady = new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", async () => {
        resolve(await protectByRole());
    }, { once: true });
});
