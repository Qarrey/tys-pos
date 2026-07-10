//======================================================
// TYS POS
// USER SESSION AND ROLE
//======================================================

let currentPOSUser = null;


//------------------------------------------------------
// GET LOGGED-IN USER AND PROFILE
//------------------------------------------------------

async function loadCurrentPOSUser() {

    const {
        data: authData,
        error: authError
    } = await supabaseClient.auth.getUser();


    if (authError || !authData.user) {

        currentPOSUser = null;

        return null;

    }


    const {
        data: profile,
        error: profileError
    } = await supabaseClient

        .from("profiles")

        .select(
            "id, full_name, role"
        )

        .eq(
            "id",
            authData.user.id
        )

        .single();


    if (profileError) {

        console.error(
            "Could not load user profile:",
            profileError
        );

        currentPOSUser = {

            id: authData.user.id,

            email: authData.user.email,

            fullName:
                authData.user.email,

            role:
                "cashier"

        };

        return currentPOSUser;

    }


    currentPOSUser = {

        id:
            authData.user.id,

        email:
            authData.user.email,

        fullName:
            profile.full_name ||
            authData.user.email,

        role:
            String(
                profile.role || "cashier"
            ).toLowerCase()

    };


    return currentPOSUser;

}


//------------------------------------------------------
// CHECK ADMIN ROLE
//------------------------------------------------------

function isAdmin() {

    return (
        currentPOSUser &&
        currentPOSUser.role === "admin"
    );

}


//------------------------------------------------------
// CHECK CASHIER ROLE
//------------------------------------------------------

function isCashier() {

    return (
        currentPOSUser &&
        currentPOSUser.role === "cashier"
    );

}