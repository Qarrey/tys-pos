//======================================================
// TYS POS
// ADMIN UI GUARD
//======================================================

function hideAdminOnlyElements() {
    document.querySelectorAll("[data-admin-only]").forEach(element => {
        element.hidden = true;
        element.setAttribute("aria-hidden", "true");
        if ("disabled" in element) element.disabled = true;
    });
}

function revealAdminOnlyElements() {
    document.querySelectorAll("[data-admin-only]").forEach(element => {
        element.hidden = false;
        element.removeAttribute("aria-hidden");
        if ("disabled" in element) element.disabled = false;
    });
}

async function initializeAdminUIGuard() {
    hideAdminOnlyElements();

    const authOkay = window.posAuthReady
        ? await window.posAuthReady
        : true;

    if (!authOkay) return false;

    const profile = typeof loadCurrentPOSUser === "function"
        ? await loadCurrentPOSUser()
        : null;

    const confirmedAdmin = Boolean(
        profile?.confirmed === true &&
        profile?.status === "active" &&
        profile?.role === "admin"
    );

    window.isConfirmedAdmin = confirmedAdmin;

    document.documentElement.classList.add("role-confirmed");
    document.documentElement.classList.toggle("admin-confirmed", confirmedAdmin);
    document.documentElement.classList.toggle(
        "cashier-confirmed",
        Boolean(profile?.confirmed && !confirmedAdmin)
    );

    if (confirmedAdmin) revealAdminOnlyElements();

    document.dispatchEvent(new CustomEvent("pos-role-confirmed", {
        detail: { profile, isAdmin: confirmedAdmin }
    }));

    return confirmedAdmin;
}

window.adminUIReady = new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", async () => {
        resolve(await initializeAdminUIGuard());
    }, { once: true });
});
