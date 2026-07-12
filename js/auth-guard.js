//======================================================
// TYS POS
// SAFE AUTHENTICATION GUARD
//======================================================

window.__posRedirecting = window.__posRedirecting || false;

function redirectPOSOnce(target) {
    if (window.__posRedirecting) return;
    window.__posRedirecting = true;
    window.location.replace(target);
}

async function protectPageAuthentication() {
    if (typeof supabaseClient === "undefined") {
        console.error("Supabase client is unavailable.");
        return false;
    }

    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Could not verify login session:", error);
            return false;
        }

        if (!data.session) {
            redirectPOSOnce("login.html");
            return false;
        }

        document.documentElement.classList.add("auth-confirmed");
        return true;
    } catch (error) {
        console.error("Authentication guard failed:", error);
        return false;
    }
}

window.posAuthReady = new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", async () => {
        resolve(await protectPageAuthentication());
    }, { once: true });
});
