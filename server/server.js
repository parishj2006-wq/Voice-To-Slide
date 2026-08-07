// Load environment variables
require("dotenv").config();


// Import packages
const express = require("express");
const cors = require("cors");


// Import routes
const slidesRoute = require("./routes/slides");
const transcribeRoute = require("./routes/transcribe");


// Create Express app
const app = express();


// Middleware
app.use(cors());

app.use(express.json());


// Serve generated PPT files
app.use("/downloads", express.static("downloads"));


// Routes
app.use(transcribeRoute);
app.use(slidesRoute);


// Test route
app.get("/", (req, res) => {

    res.send("Voice to Slide Backend is Running");

});


// Start server
const PORT = process.env.PORT || 5000;


app.listen(PORT, ()=>{

    console.log(`Server running on port ${PORT}`);

});