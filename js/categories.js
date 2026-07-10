//======================================================
// TYS POS v3
// CATEGORIES MODULE
//======================================================

const CATEGORY_KEY = "tys-pos-categories";

function getCategories() {
    try {
        return JSON.parse(localStorage.getItem(CATEGORY_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCategories(categories) {
    localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
}

function saveCategory() {
    const name = document.getElementById("category-name").value.trim();
    const description = document.getElementById("category-description").value.trim();

    if (!name) {
        alert("Category name is required.");
        return;
    }

    const categories = getCategories();

    categories.unshift({
        id: generateId("CAT-"),
        name,
        description,
        createdAt: new Date().toISOString()
    });

    saveCategories(categories);

    renderCategories();

    document.getElementById("category-form").reset();
}

function renderCategories() {
    const list = document.getElementById("category-list");

    if (!list) return;

    const categories = getCategories();
    const products = loadState().inventory || [];

    if (!categories.length) {
        list.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        No categories saved.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    list.innerHTML = categories.map(category => {
        const count = products.filter(product => {
            return (product.category || "").toLowerCase() === category.name.toLowerCase();
        }).length;

        return `
            <tr>
                <td><strong>${category.name}</strong></td>
                <td>${category.description || "-"}</td>
                <td>${count}</td>
                <td>
                    <button
                        class="danger-btn delete-category"
                        data-id="${category.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll(".delete-category").forEach(button => {
        button.addEventListener("click", () => {
            deleteCategory(button.dataset.id);
        });
    });
}

function deleteCategory(id) {
    let categories = getCategories();

    const category = categories.find(item => item.id === id);

    if (!category) return;

    if (!confirm(`Delete category "${category.name}"?`)) return;

    categories = categories.filter(item => item.id !== id);

    saveCategories(categories);

    renderCategories();
}

function initializeCategoriesModule() {
    renderCategories();

    const form = document.getElementById("category-form");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            saveCategory();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeCategoriesModule);