//======================================================
// TYS POS v3
// USERS MODULE
//======================================================

const USER_KEY = "tys-pos-users";

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USER_KEY, JSON.stringify(users));
}

function saveUser() {
    const name = document.getElementById("user-name").value.trim();
    const role = document.getElementById("user-role").value;
    const status = document.getElementById("user-status").value;
    const phone = document.getElementById("user-phone").value.trim();

    if (!name) {
        alert("User name is required.");
        return;
    }

    const users = getUsers();

    users.unshift({
        id: generateId("USR-"),
        name,
        role,
        status,
        phone,
        createdAt: new Date().toISOString()
    });

    saveUsers(users);

    renderUsers();

    document.getElementById("user-form").reset();
}

function renderUsers() {
    const list = document.getElementById("user-list");

    if (!list) return;

    const users = getUsers();

    updateUserSummary(users);

    if (!users.length) {
        list.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state">
                        No users saved.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.name}</strong></td>
            <td>${user.role}</td>
            <td>${user.status}</td>
            <td>${user.phone || "-"}</td>
            <td>
                <button
                    class="danger-btn delete-user"
                    data-id="${user.id}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".delete-user").forEach(button => {
        button.addEventListener("click", () => {
            deleteUser(button.dataset.id);
        });
    });
}

function updateUserSummary(users = getUsers()) {
    const total = document.getElementById("user-count");
    const active = document.getElementById("active-user-count");
    const admins = document.getElementById("admin-count");

    if (total) total.textContent = users.length;

    if (active) {
        active.textContent = users.filter(user => user.status === "Active").length;
    }

    if (admins) {
        admins.textContent = users.filter(user => user.role === "Admin").length;
    }
}

function deleteUser(id) {
    let users = getUsers();

    const user = users.find(item => item.id === id);

    if (!user) return;

    if (!confirm(`Delete user "${user.name}"?`)) return;

    users = users.filter(item => item.id !== id);

    saveUsers(users);

    renderUsers();
}

function initializeUsersModule() {
    renderUsers();

    const form = document.getElementById("user-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveUser();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeUsersModule);