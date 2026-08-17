// =========================================================
// VOICE TO SLIDE
// RAZORPAY PAYMENT ROUTE
// STEP 12.2
// =========================================================


const express =
    require("express");

const crypto =
    require("crypto");

const Razorpay =
    require("razorpay");


const router =
    express.Router();


// =========================================================
// RAZORPAY CONFIGURATION
// =========================================================

const razorpay =
    new Razorpay({

        key_id:
            process.env.RAZORPAY_KEY_ID,

        key_secret:
            process.env.RAZORPAY_KEY_SECRET

    });


// =========================================================
// PRICE
// =========================================================

const PRICE_PER_MINUTE =
    10;


// =========================================================
// CREATE PAYMENT ORDER
// =========================================================

router.post(
    "/create-payment-order",
    async (req, res) => {

        try {

            console.log(
                "================================="
            );

            console.log(
                "CREATE PAYMENT ORDER"
            );

            console.log(
                "================================="
            );


            // -----------------------------------------
            // CHECK RAZORPAY CONFIGURATION
            // -----------------------------------------

            if (
                !process.env.RAZORPAY_KEY_ID ||
                !process.env.RAZORPAY_KEY_SECRET
            ) {

                console.error(
                    "RAZORPAY KEYS ARE MISSING"
                );

                return res.status(500).json({

                    success: false,

                    error:
                        "Razorpay is not configured on the server."

                });

            }


            // -----------------------------------------
            // GET MINUTES FROM FRONTEND
            // -----------------------------------------

            const minutes =
                Number(
                    req.body.minutes
                );


            console.log(
                "Requested minutes:",
                minutes
            );


            // -----------------------------------------
            // VALIDATE MINUTES
            // -----------------------------------------

            if (
                !Number.isFinite(minutes) ||
                minutes < 1
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Invalid audio duration."

                });

            }


            // -----------------------------------------
            // SAFETY LIMIT
            // -----------------------------------------

            if (
                minutes > 600
            ) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Audio file is too long."

                });

            }


            // -----------------------------------------
            // CALCULATE PRICE
            // -----------------------------------------

            const price =
                minutes *
                PRICE_PER_MINUTE;


            // Razorpay uses paise
            //
            // ₹10 = 1000 paise

            const amountInPaise =
                price * 100;


            console.log(
                "Billable minutes:",
                minutes
            );

            console.log(
                "Price:",
                `₹${price}`
            );

            console.log(
                "Amount in paise:",
                amountInPaise
            );


            // -----------------------------------------
            // CREATE RAZORPAY ORDER
            // -----------------------------------------

            const order =
                await razorpay.orders.create({

                    amount:
                        amountInPaise,

                    currency:
                        "INR",

                    receipt:
                        `voice_slide_${Date.now()}`,

                    notes: {

                        product:
                            "VoiceToSlide",

                        minutes:
                            String(minutes),

                        price:
                            String(price)

                    }

                });


            console.log(
                "Razorpay order created:"
            );

            console.log(
                order.id
            );


            // -----------------------------------------
            // SEND ORDER TO FRONTEND
            // -----------------------------------------

            res.json({

                success: true,

                orderId:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency,

                minutes:
                    minutes,

                price:
                    price

            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "RAZORPAY ORDER ERROR"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );


            res.status(500).json({

                success: false,

                error:
                    "Unable to create payment order."

            });

        }

    }
);


// =========================================================
// VERIFY PAYMENT
// =========================================================

router.post(
    "/verify-payment",
    async (req, res) => {

        try {

            console.log(
                "================================="
            );

            console.log(
                "VERIFY RAZORPAY PAYMENT"
            );

            console.log(
                "================================="
            );


            const {

                razorpay_order_id,

                razorpay_payment_id,

                razorpay_signature

            } = req.body;


            // -----------------------------------------
            // VALIDATE RESPONSE
            // -----------------------------------------

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {

                console.error(
                    "Incomplete Razorpay response"
                );


                return res.status(400).json({

                    success: false,

                    error:
                        "Incomplete payment information."

                });

            }


            console.log(
                "Order ID:",
                razorpay_order_id
            );

            console.log(
                "Payment ID:",
                razorpay_payment_id
            );


            // -----------------------------------------
            // CREATE EXPECTED SIGNATURE
            // -----------------------------------------

            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env.RAZORPAY_KEY_SECRET
                    )
                    .update(
                        razorpay_order_id +
                        "|" +
                        razorpay_payment_id
                    )
                    .digest("hex");


            // -----------------------------------------
            // COMPARE SIGNATURES
            // -----------------------------------------

            const generatedBuffer =
                Buffer.from(
                    generatedSignature
                );

            const receivedBuffer =
                Buffer.from(
                    razorpay_signature
                );


            if (
                generatedBuffer.length !==
                receivedBuffer.length
            ) {

                console.error(
                    "INVALID PAYMENT SIGNATURE"
                );


                return res.status(400).json({

                    success: false,

                    error:
                        "Payment verification failed."

                });

            }


            const isValid =
                crypto.timingSafeEqual(
                    generatedBuffer,
                    receivedBuffer
                );


            // -----------------------------------------
            // PAYMENT FAILED
            // -----------------------------------------

            if (!isValid) {

                console.error(
                    "================================="
                );

                console.error(
                    "INVALID RAZORPAY SIGNATURE"
                );

                console.error(
                    "================================="
                );


                return res.status(400).json({

                    success: false,

                    error:
                        "Payment verification failed."

                });

            }


            // -----------------------------------------
            // PAYMENT VERIFIED
            // -----------------------------------------

            console.log(
                "================================="
            );

            console.log(
                "PAYMENT VERIFIED SUCCESSFULLY"
            );

            console.log(
                "Payment ID:",
                razorpay_payment_id
            );

            console.log(
                "Order ID:",
                razorpay_order_id
            );

            console.log(
                "================================="
            );


            res.json({

                success: true,

                message:
                    "Payment verified successfully.",

                paymentId:
                    razorpay_payment_id,

                orderId:
                    razorpay_order_id

            });


        } catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "PAYMENT VERIFICATION ERROR"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );


            res.status(500).json({

                success: false,

                error:
                    "Payment verification failed."

            });

        }

    }
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports =
    router;