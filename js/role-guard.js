//======================================================
// TYS POS
// PAGE ROLE GUARD
//======================================================

async function protectByRole() {
    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    const cashierAllowedPages = new Set([
        "index.html",
        "purchases.html",
        "register.html",
        "login.html",
        ""
    ]);

    const profile = typeof loadCurrentPOSUser === "function"
        ? await loadCurrentPOSUser()
        : null;

    if (!profile || profile.confirmed !== true || profile.status !== "active") {
        if (currentPage !== "login.html") {
            window.location.replace("login.html");
        }
        return false;
    }

    const pageMarkedAdmin = document.body?.hasAttribute("data-admin-page");
    const confirmedAdmin = window.isConfirmedAdmin === true;

    if ((pageMarkedAdmin || !cashierAllowedPages.has(currentPage)) && !confirmedAdmin) {
        window.location.replace("index.html");
        return false;
    }

    document.documentElement.classList.add("page-access-confirmed");
    return true;
}

document.addEventListener("DOMContentLoaded", protectByRole, { once: true });
