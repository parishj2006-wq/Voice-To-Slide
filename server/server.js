require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const transcribeRoute = require("./routes/transcribe");
const slidesRoute = require("./routes/slides");

const app = express();

app.use(cors());

app.use(express.json());


// ==========================================
// SERVE GENERATED PPT FILES
// ==========================================

app.use(
    "/downloads",
    express.static(
        path.join(__dirname, "downloads")
    )
);


// ==========================================
// API ROUTES
// ==========================================

app.use(transcribeRoute);

app.use(slidesRoute);


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message: "Voice to Slide Backend is Running"
    });

});


// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server started on port ${PORT}`
    );

});