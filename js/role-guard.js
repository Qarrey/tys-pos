//======================================================
// TYS POS
// ROLE GUARD
//======================================================

async function protectByRole() {
    if (typeof loadCurrentPOSUser === "function") {
        await loadCurrentPOSUser();
    }

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    const cashierAllowedPages = [
        "index.html",
        "purchases.html",
        "login.html"
    ];

    const role =
        currentPOSUser && currentPOSUser.role
            ? currentPOSUser.role
            : "cashier";

    if (
        role === "cashier" &&
        !cashierAllowedPages.includes(currentPage)
    ) {
        alert("You do not have permission to access this page.");
        window.location.href = "index.html";
    }
}

document.addEventListener("DOMContentLoaded", protectByRole);