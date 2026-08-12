const express = require("express");
const router = express.Router();

const groq = require("../services/groq");
const createPresentation = require("../services/ppt");

router.post("/generate-slides", async (req, res) => {

    try {

        const transcript = req.body.transcript;

        if (!transcript) {
            return res.status(400).json({
                error: "No transcript provided"
            });
        }

        console.log("================================");
        console.log("GENERATING SLIDES");
        console.log("================================");


        const result = await groq.chat.completions.create({

            model: "llama-3.1-8b-instant",

            temperature: 0,

            response_format: {
                type: "json_object"
            },

            messages: [

                {
                    role: "system",

                    content: `
You create PowerPoint presentations.

You MUST return ONLY valid JSON.

The JSON must have exactly this structure:

{
  "slides": [
    {
      "title": "Example title",
      "points": [
        "Example point one",
        "Example point two",
        "Example point three"
      ]
    }
  ]
}

IMPORTANT:
- The response must be valid JSON.
- Use double quotes for all JSON strings.
- Never use single quotes.
- Never put comments inside JSON.
- Never put trailing commas.
- Every opening { must have a matching }.
- Every opening [ must have a matching ].
- Create 4 to 6 slides.
- Each slide must contain 3 to 5 points.
- Keep points short.
- Use only information from the transcript.
`
                },

                {
                    role: "user",

                    content:
                        "Create presentation slides from this transcript:\n\n" +
                        transcript

                }

            ]

        });


        const aiResponse =
            result.choices[0].message.content;


        console.log("================================");
        console.log("RAW AI RESPONSE");
        console.log("================================");

        console.log(aiResponse);


        if (!aiResponse) {

            return res.status(500).json({
                error: "AI returned an empty response"
            });

        }


        let parsed;

        try {

            parsed =
                JSON.parse(aiResponse);

        } catch (jsonError) {

            console.log("================================");
            console.log("JSON PARSING FAILED");
            console.log("================================");

            console.log(
                jsonError.message
            );

            console.log(
                "AI RESPONSE:",
                aiResponse
            );


            return res.status(500).json({

                error:
                    "AI returned invalid JSON",

                details:
                    jsonError.message

            });

        }


        if (
            !parsed ||
            !Array.isArray(parsed.slides)
        ) {

            return res.status(500).json({

                error:
                    "AI response does not contain a valid slides array"

            });

        }


        const slides =
            parsed.slides.map(
                (slide, index) => {

                    let points = [];

                    if (
                        Array.isArray(
                            slide.points
                        )
                    ) {

                        points =
                            slide.points
                                .map(
                                    point =>
                                        String(point)
                                )
                                .filter(
                                    point =>
                                        point.trim() !== ""
                                );

                    }


                    return {

                        title:
                            slide.title
                                ? String(
                                    slide.title
                                )
                                : `Slide ${index + 1}`,

                        points:
                            points

                    };

                }
            );


        if (slides.length === 0) {

            return res.status(500).json({

                error:
                    "AI generated zero slides"

            });

        }


        console.log(
            "VALID SLIDES:",
            slides.length
        );


        // =====================================
        // CREATE POWERPOINT
        // =====================================

        const file =
            await createPresentation(
                slides
            );


        console.log(
            "PRESENTATION CREATED:",
            file
        );


        // =====================================
        // SEND RESULT
        // =====================================

        res.json({

            slides:
                slides,

            file:
                file

        });


    } catch (error) {

        console.log(
            "SLIDE GENERATION ERROR:"
        );

        console.log(error);


        res.status(500).json({

            error:
                error.message

        });

    }

});


module.exports = router;