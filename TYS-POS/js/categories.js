//======================================================
// TYS POS v3
// CATEGORIES MODULE
// LOCAL + SUPABASE
//======================================================

const CATEGORY_KEY = "tys-pos-categories";


//======================================================
// LOCAL STORAGE
//======================================================

function getCategories() {
    try {
        return (
            JSON.parse(
                localStorage.getItem(
                    CATEGORY_KEY
                )
            ) || []
        );
    } catch (error) {
        console.error(
            "Could not load categories:",
            error
        );

        return [];
    }
}


function saveCategories(categories) {
    localStorage.setItem(
        CATEGORY_KEY,
        JSON.stringify(
            categories || []
        )
    );
}


//======================================================
// SAVE CATEGORY
//======================================================

async function saveCategory() {
    const nameInput =
        document.getElementById(
            "category-name"
        );

    const descriptionInput =
        document.getElementById(
            "category-description"
        );

    const name =
        nameInput
            ? nameInput.value.trim()
            : "";

    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";

    if (!name) {
        alert(
            "Category name is required."
        );

        return;
    }

    const categories =
        getCategories();

    const duplicate =
        categories.some(
            category =>
                String(
                    category.name || ""
                )
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );

    if (duplicate) {
        alert(
            "This category already exists."
        );

        return;
    }

    const localCategory = {
        id:
            typeof generateId ===
            "function"
                ? generateId("CAT-")
                : `CAT-${Date.now()}`,

        name,

        description,

        createdAt:
            new Date().toISOString()
    };

    categories.unshift(
        localCategory
    );

    saveCategories(
        categories
    );

    renderCategories();

    const form =
        document.getElementById(
            "category-form"
        );

    if (form) {
        form.reset();
    }


    //--------------------------------------------------
    // SAVE TO SUPABASE
    //--------------------------------------------------

    if (
        typeof saveCategoryToSupabase ===
        "function"
    ) {
        try {
            const cloudCategory =
                await saveCategoryToSupabase(
                    localCategory
                );

            if (cloudCategory) {
                console.log(
                    "Category saved locally and online."
                );

                if (
                    typeof syncCloudCategoriesToPOS ===
                    "function"
                ) {
                    await syncCloudCategoriesToPOS();
                }
            }

        } catch (error) {
            console.error(
                "Cloud category save failed:",
                error
            );

            alert(
                "Category was saved on this device but not online."
            );
        }
    }
}


//======================================================
// RENDER CATEGORIES
//======================================================

function renderCategories() {
    const list =
        document.getElementById(
            "category-list"
        );

    if (!list) {
        return;
    }

    const categories =
        getCategories();

    let products = [];

    try {
        if (
            typeof loadState ===
            "function"
        ) {
            products =
                loadState().inventory ||
                [];
        }
    } catch (error) {
        console.error(
            "Could not load products for category count:",
            error
        );
    }

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

    list.innerHTML =
        categories
            .map(category => {
                const categoryName =
                    String(
                        category.name || ""
                    );

                const count =
                    products.filter(
                        product =>
                            String(
                                product.category ||
                                ""
                            )
                                .trim()
                                .toLowerCase() ===
                            categoryName
                                .trim()
                                .toLowerCase()
                    ).length;

                return `
                    <tr>

                        <td>
                            <strong>
                                ${categoryName}
                            </strong>
                        </td>

                        <td>
                            ${
                                category.description ||
                                "-"
                            }
                        </td>

                        <td>
                            ${count}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="danger-btn delete-category"
                                data-id="${category.id}">

                                Delete

                            </button>

                        </td>

                    </tr>
                `;
            })
            .join("");


    document
        .querySelectorAll(
            ".delete-category"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    deleteCategory(
                        button.dataset.id
                    );
                }
            );
        });
}


//======================================================
// DELETE CATEGORY
//======================================================

async function deleteCategory(id) {
    let categories =
        getCategories();

    const category =
        categories.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!category) {
        return;
    }

    if (
        !confirm(
            `Delete category "${category.name}"?`
        )
    ) {
        return;
    }

    categories =
        categories.filter(
            item =>
                String(item.id) !==
                String(id)
        );

    saveCategories(
        categories
    );

    renderCategories();


    //--------------------------------------------------
    // DELETE FROM SUPABASE
    //--------------------------------------------------

    if (
        typeof deleteCategoryFromSupabase ===
        "function"
    ) {
        try {
            const success =
                await deleteCategoryFromSupabase(
                    id
                );

            if (
                success &&
                typeof syncCloudCategoriesToPOS ===
                "function"
            ) {
                await syncCloudCategoriesToPOS();
            }

        } catch (error) {
            console.error(
                "Cloud category deletion failed:",
                error
            );
        }
    }
}


//======================================================
// INITIALIZE
//======================================================

function initializeCategoriesModule() {
    renderCategories();

    const form =
        document.getElementById(
            "category-form"
        );

    if (
        form &&
        !form.dataset.ready
    ) {
        form.dataset.ready =
            "true";

        form.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                saveCategory();
            }
        );
    }
}


//======================================================
// AUTO START
//======================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeCategoriesModule
);