// =========================================================
// VOICE TO SLIDE BACKEND
// STEP 12.2 - RAZORPAY PAYMENT INTEGRATION
// =========================================================


// =========================================================
// LOAD ENVIRONMENT VARIABLES
// =========================================================

require("dotenv").config();


// =========================================================
// IMPORT PACKAGES
// =========================================================

const express = require("express");
const cors = require("cors");


// =========================================================
// IMPORT ROUTES
// =========================================================

const slidesRoute =
    require("./routes/slides");

const transcribeRoute =
    require("./routes/transcribe");

const paymentRoute =
    require("./routes/payment");


// =========================================================
// CREATE EXPRESS APP
// =========================================================

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
    cors()
);

app.use(
    express.json()
);


// =========================================================
// ROUTES
// =========================================================

// Transcription
app.use(
    transcribeRoute
);


// Slide generation
app.use(
    slidesRoute
);


// Razorpay payment
app.use(
    paymentRoute
);


// =========================================================
// TEST ROUTE
// =========================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "Voice to Slide Backend is Running"
        );

    }
);


// =========================================================
// START SERVER
// =========================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "VOICE TO SLIDE BACKEND"
        );

        console.log(
            "================================="
        );

        console.log(
            `Server started on port ${PORT}`
        );

        console.log(
            "Payment system: Razorpay"
        );

        console.log(
            "Price: ₹10 per started minute"
        );

        console.log(
            "================================="
        );

    }
);