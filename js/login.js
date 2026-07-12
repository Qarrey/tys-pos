//======================================================
// TYS POS
// LOGIN MODULE
//======================================================

async function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const button = document.getElementById("login-btn");
    const message = document.getElementById("login-message");

    button.disabled = true;
    button.textContent = "Signing in...";
    message.textContent = "";
    message.className = "feedback-message";

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        if (!data.session?.user) throw new Error("Login was unsuccessful.");

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("id, role, status")
            .eq("id", data.session.user.id)
            .maybeSingle();

        if (profileError || !profile) {
            await supabaseClient.auth.signOut();
            throw new Error("Your login exists, but no POS profile was found.");
        }

        if (String(profile.status || "").trim().toLowerCase() !== "active") {
            await supabaseClient.auth.signOut();
            throw new Error("This POS account is inactive.");
        }

        message.textContent = "Login successful. Opening POS...";
        message.className = "feedback-message success";

        window.location.replace("index.html");
    } catch (error) {
        console.error("Login error:", error);
        message.textContent = error.message || "Could not sign in.";
        message.className = "feedback-message error";
        button.disabled = false;
        button.textContent = "Sign In";
    }
}

async function checkExistingLogin() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error || !data.session?.user) return;

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("id, status")
            .eq("id", data.session.user.id)
            .maybeSingle();

        if (profileError || !profile) {
            await supabaseClient.auth.signOut();
            return;
        }

        if (String(profile.status || "").trim().toLowerCase() !== "active") {
            await supabaseClient.auth.signOut();
            return;
        }

        window.location.replace("index.html");
    } catch (error) {
        console.error("Existing-login check failed:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    if (form) form.addEventListener("submit", loginUser);
    checkExistingLogin();
}, { once: true });
