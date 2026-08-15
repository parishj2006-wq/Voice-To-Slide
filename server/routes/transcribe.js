const express = require("express");
const router = express.Router();

const groq = require("../services/groq");
const upload = require("./upload");

const fs = require("fs");
const mm = require("music-metadata");


router.post("/transcribe", upload.single("audio"), async (req, res) => {

    try {

        console.log("=================================");
        console.log("TRANSCRIPTION STARTED");
        console.log("=================================");


        // =========================================
        // CHECK FILE
        // =========================================

        if (!req.file) {

            return res.status(400).json({

                error: "No audio file uploaded"

            });

        }


        console.log("File received:");
        console.log(req.file);


        // =========================================
        // AUDIO DURATION
        // =========================================

        const metadata =
            await mm.parseFile(req.file.path);


        const rawDurationSeconds =
            metadata.format.duration;


        if (
            !rawDurationSeconds ||
            !Number.isFinite(rawDurationSeconds)
        ) {

            throw new Error(
                "Could not determine audio duration."
            );

        }


        // Convert to whole seconds
        const totalSeconds =
            Math.round(rawDurationSeconds);


        // =========================================
        // DISPLAY DURATION
        // =========================================
        //
        // Example:
        //
        // 238 seconds
        //
        // becomes:
        //
        // 3 minutes
        // 58 seconds
        //
        // =========================================

        const displayMinutes =
            Math.floor(totalSeconds / 60);


        const displaySeconds =
            totalSeconds % 60;


        // =========================================
        // BILLING
        // =========================================
        //
        // Every started minute is charged.
        //
        // 30 sec  -> 1 min -> ₹10
        // 60 sec  -> 1 min -> ₹10
        // 61 sec  -> 2 min -> ₹20
        // 178 sec -> 3 min -> ₹30
        // 238 sec -> 4 min -> ₹40
        //
        // =========================================

        const billableMinutes =
            Math.ceil(totalSeconds / 60);


        const price =
            billableMinutes * 10;


        console.log("---------------------------------");
        console.log(
            "RAW DURATION:",
            rawDurationSeconds,
            "seconds"
        );

        console.log(
            "TOTAL SECONDS:",
            totalSeconds
        );

        console.log(
            "DISPLAY DURATION:",
            displayMinutes,
            "min",
            displaySeconds,
            "sec"
        );

        console.log(
            "BILLABLE MINUTES:",
            billableMinutes
        );

        console.log(
            "PROCESSING PRICE:",
            `₹${price}`
        );
        console.log("---------------------------------");


        // =========================================
        // WHISPER TRANSCRIPTION
        // =========================================

        console.log(
            "Starting Whisper transcription..."
        );


        const transcription =
            await groq.audio.transcriptions.create({

                file:
                    fs.createReadStream(
                        req.file.path
                    ),

                model:
                    "whisper-large-v3"

            });


        console.log(
            "Transcription completed."
        );


        console.log(
            "Transcript:"
        );

        console.log(
            transcription.text
        );


        // =========================================
        // SEND RESPONSE
        // =========================================

        console.log(
            "Sending response to frontend..."
        );


        res.json({

            message:
                "Audio transcribed successfully",


            transcript:
                transcription.text,


            // Actual formatted duration
            duration: {

                minutes:
                    displayMinutes,

                seconds:
                    displaySeconds,

                // Total duration is also available
                totalSeconds:
                    totalSeconds

            },


            // Billing information
            billableMinutes:
                billableMinutes,


            price:
                `₹${price}`

        });


    }

    catch (error) {

        console.log("=================================");
        console.log("WHISPER ERROR");
        console.log("=================================");

        console.log(
            error.message
        );


        res.status(500).json({

            error:
                error.message

        });

    }

});


module.exports = router;