const createPresentation = require("../services/ppt");
const express = require("express");
const router = express.Router();

const groq = require("../services/groq");


router.post("/generate-slides", async (req, res) => {


    try {


        const transcript = req.body.transcript;


        if (!transcript) {

            return res.status(400).json({
                error: "No transcript provided"
            });

        }



        console.log("Generating slides...");



        const result = await groq.chat.completions.create({


            model: "llama-3.1-8b-instant",


            messages: [

                {


                    role: "system",

                    content: `
You are an expert presentation creator.

Your job is to convert a transcript into a professional presentation.

Rules:
- Create meaningful slide titles.
- Extract the most important ideas from the transcript.
- Each slide should contain 3-5 useful bullet points.
- Do not create generic titles like "Slide 1", "Slide 2".
- Make the presentation suitable for an academic or professional audience.
- Keep the content concise and clear.

Return ONLY valid JSON.

JSON format:

[
  {
    "title": "Actual Slide Title",
    "points": [
      "Important point 1",
      "Important point 2",
      "Important point 3"
    ]
  }
]

Do not add explanations.
Do not use markdown.
Do not use code blocks.
`

                },


                {


                    role: "user",

                    content: `
Create a presentation from this transcript:

${transcript}
`

                }


            ]


        });



        const aiResponse = result.choices[0].message.content;



        console.log("RAW AI RESPONSE:");
        console.log(aiResponse);



        // Remove markdown if AI adds it

        let cleanResponse = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();



        // Extract only JSON array

        const start = cleanResponse.indexOf("[");
        const end = cleanResponse.lastIndexOf("]");


        cleanResponse = cleanResponse.substring(
            start,
            end + 1
        );



        const slides = JSON.parse(cleanResponse);



        console.log("SLIDES CREATED:");
        console.log(slides);



        // Create PowerPoint

        const file = await createPresentation(slides);



        res.json({

    slides: slides,

    file: file,

    downloadUrl:
    `http://localhost:5000/downloads/${file}`

});



    }


    catch (error) {


        console.log("SLIDE GENERATION ERROR:");
        console.log(error.message);



        res.status(500).json({

            error: error.message

        });


    }



});


module.exports = router;