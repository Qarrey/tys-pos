//======================================================
// TYS POS
// AUTH GUARD
//======================================================

async function protectPage() {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        window.location.href = "login.html";
    }
}

document.addEventListener("DOMContentLoaded", protectPage);