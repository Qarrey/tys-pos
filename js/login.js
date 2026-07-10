//======================================================
// TYS POS
// LOGIN MODULE
//======================================================

async function loginUser(event) {

    event.preventDefault();


    const email =

        document
            .getElementById("login-email")
            .value
            .trim();


    const password =

        document
            .getElementById("login-password")
            .value;


    const button =

        document.getElementById(
            "login-btn"
        );


    const message =

        document.getElementById(
            "login-message"
        );


    button.disabled = true;

    button.textContent =
        "Signing in...";


    message.textContent = "";

    message.className =
        "feedback-message";


    try {

        const {

            data,

            error

        } =

        await supabaseClient
            .auth
            .signInWithPassword({

                email,

                password

            });


        if (error) {

            throw error;

        }


        if (!data.user) {

            throw new Error(

                "Login was unsuccessful."

            );

        }


        message.textContent =

            "Login successful. Opening POS...";


        message.className =

            "feedback-message success";


        setTimeout(() => {

            window.location.href =

                "index.html";

        }, 700);


    } catch (error) {

        console.error(

            "Login error:",

            error

        );


        message.textContent =

            error.message ||

            "Could not sign in.";


        message.className =

            "feedback-message error";


    } finally {

        button.disabled = false;

        button.textContent =

            "Sign In";

    }

}


//------------------------------------------------------
// CHECK EXISTING LOGIN
//------------------------------------------------------

async function checkExistingLogin() {

    const {

        data

    } =

    await supabaseClient
        .auth
        .getSession();


    if (

        data.session

    ) {

        window.location.href =

            "index.html";

    }

}


//------------------------------------------------------
// INITIALIZE
//------------------------------------------------------

document.addEventListener(

    "DOMContentLoaded",

    () => {


        const form =

            document.getElementById(

                "login-form"

            );


        if (form) {

            form.addEventListener(

                "submit",

                loginUser

            );

        }


        checkExistingLogin();

    }

);