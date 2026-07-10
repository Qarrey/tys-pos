//======================================================
// TYS POS v3
// SHARED NAVIGATION WITH ROLES
//======================================================

async function loadNavigation() {
    const navContainer = document.getElementById("main-navigation");

    if (!navContainer) return;

    if (typeof loadCurrentPOSUser === "function") {
        await loadCurrentPOSUser();
    }

    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    const role =
        currentPOSUser && currentPOSUser.role
            ? currentPOSUser.role
            : "cashier";

    const adminNavigation = `
        <div class="nav-group">
            <span class="nav-group-title">Main</span>
            <a href="index.html" class="nav-link">POS</a>
            <a href="inventory.html" class="nav-link">Inventory</a>
            <a href="purchases.html" class="nav-link">Purchases</a>
            <a href="stock.html" class="nav-link">Stock</a>
        </div>

        <div class="nav-group">
            <span class="nav-group-title">People</span>
            <a href="suppliers.html" class="nav-link">Suppliers</a>
            <a href="customers.html" class="nav-link">Customers</a>
            <a href="users.html" class="nav-link">Users</a>
        </div>

        <div class="nav-group">
            <span class="nav-group-title">Finance</span>
            <a href="expenses.html" class="nav-link">Expenses</a>
            <a href="profit.html" class="nav-link">Profit</a>
            <a href="register.html" class="nav-link">Register</a>
            <a href="payment-report.html" class="nav-link">Payments</a>
        </div>

        <div class="nav-group">
            <span class="nav-group-title">Reports</span>
            <a href="reports.html" class="nav-link">Reports</a>
            <a href="daily-summary.html" class="nav-link">Daily</a>
            <a href="monthly-summary.html" class="nav-link">Monthly</a>
            <a href="yearly-summary.html" class="nav-link">Yearly</a>
            <a href="product-profit.html" class="nav-link">Product Profit</a>
        </div>

        <div class="nav-group">
            <span class="nav-group-title">System</span>
            <a href="categories.html" class="nav-link">Categories</a>
            <a href="alerts.html" class="nav-link">Alerts</a>
            <a href="stocktake.html" class="nav-link">Stocktake</a>
            <a href="returns.html" class="nav-link">Returns</a>
            <a href="backup.html" class="nav-link">Backup</a>
            <a href="settings.html" class="nav-link">Settings</a>
        </div>
    `;

    const cashierNavigation = `
    <div class="nav-group">

        <span class="nav-group-title">
            Cashier
        </span>

        <a
            href="index.html"
            class="nav-link">

            POS

        </a>

        <a
            href="purchases.html"
            class="nav-link">

            Purchases

        </a>

    </div>
`;

    navContainer.innerHTML =
        role === "admin"
            ? adminNavigation
            : cashierNavigation;

    navContainer.innerHTML += `
        <div class="nav-group">
            <span class="nav-group-title">Account</span>
            <a href="#" id="logout-btn" class="nav-link">Logout</a>
        </div>
    `;

    navContainer.querySelectorAll(".nav-link").forEach(link => {
        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        }
    });

    const logoutBtn = document.getElementById("logout-btn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async event => {
            event.preventDefault();

            await supabaseClient.auth.signOut();

            window.location.href = "login.html";
        });
    }
}

document.addEventListener("DOMContentLoaded", loadNavigation);