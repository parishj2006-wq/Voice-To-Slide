const express = require("express");
const router = express.Router();

const groq = require("../services/groq");
const upload = require("./upload");

const fs = require("fs");

const mm = require("music-metadata");


router.post("/transcribe", upload.single("audio"), async(req,res)=>{


try {


    console.log("Transcription started...");


    if (!req.file) {


        return res.status(400).json({

            error:"No audio file uploaded"

        });


    }



    console.log("File received:");
    console.log(req.file);




    // ==========================
    // AUDIO DURATION CALCULATION
    // ==========================


    const metadata = await mm.parseFile(req.file.path);


    const durationSeconds = metadata.format.duration;


    const durationMinutes = Math.ceil(
        durationSeconds / 60
    );


    const price = durationMinutes * 10;



    console.log(
        "Duration:",
        durationSeconds,
        "seconds"
    );


    console.log(
        "Price:",
        price
    );





    // ==========================
    // WHISPER TRANSCRIPTION
    // ==========================


    const transcription = await groq.audio.transcriptions.create({


        file: fs.createReadStream(req.file.path),


        model:"whisper-large-v3"


    });




    console.log("Transcript:");
    console.log(transcription.text);





    console.log("Sending response to frontend...");



    res.json({


        message:"Audio transcribed successfully",


        transcript:transcription.text,


        duration:{

            seconds:Math.round(durationSeconds),

            minutes:durationMinutes

        },


        price:`₹${price}`



    });



}



catch(error){



    console.log("WHISPER ERROR:");

    console.log(error.message);



    res.status(500).json({

        error:error.message

    });



}



});



module.exports = router;