// =========================================================
// VOICE TO SLIDE BACKEND
// RAZORPAY + TRANSCRIPTION + SLIDE GENERATION
// =========================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const slidesRoute = require("./routes/slides");
const transcribeRoute = require("./routes/transcribe");
const paymentRoute = require("./routes/payment");

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());


// =========================================================
// DOWNLOADS
// =========================================================

app.use(
    "/downloads",
    express.static(
        require("path").join(
            __dirname,
            "../downloads"
        )
    )
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
// HOME TEST
// =========================================================

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Voice to Slide Backend is Running",

            payment:
                "Razorpay Enabled"

        });

    }
);


// =========================================================
// PAYMENT TEST
// =========================================================

app.get(
    "/payment-test",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Payment route is working",

            razorpayKeyConfigured:
                !!process.env.RAZORPAY_KEY_ID,

            razorpaySecretConfigured:
                !!process.env.RAZORPAY_KEY_SECRET

        });

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