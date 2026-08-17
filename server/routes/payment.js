// =========================================================
// VOICE TO SLIDE
// RAZORPAY PAYMENT ROUTE
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const router = express.Router();

// =========================================================
// PRICE
// =========================================================

const PRICE_PER_MINUTE = 10;

// =========================================================
// CREATE RAZORPAY INSTANCE
// =========================================================

let razorpay = null;

if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET
) {

    razorpay = new Razorpay({

        key_id:
            process.env.RAZORPAY_KEY_ID,

        key_secret:
            process.env.RAZORPAY_KEY_SECRET

    });

    console.log(
        "RAZORPAY: CONFIGURED"
    );

} else {

    console.error(
        "RAZORPAY: KEYS NOT FOUND"
    );

}

// =========================================================
// PAYMENT HEALTH CHECK
// =========================================================

router.get(
    "/payment-test",
    (req, res) => {

        res.json({

            success:
                true,

            razorpayConfigured:
                !!razorpay,

            message:
                razorpay
                    ? "Razorpay payment system is configured."
                    : "Razorpay keys are missing."

        });

    }
);

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
            // CHECK RAZORPAY
            // -----------------------------------------

            if (!razorpay) {

                console.error(
                    "RAZORPAY IS NOT CONFIGURED"
                );

                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Razorpay is not configured on the server."

                });

            }

            // -----------------------------------------
            // GET MINUTES
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
            // VALIDATE
            // -----------------------------------------

            if (
                !Number.isFinite(minutes) ||
                minutes < 1
            ) {

                return res.status(400).json({

                    success:
                        false,

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

                    success:
                        false,

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
                "Amount:",
                amountInPaise,
                "paise"
            );

            // -----------------------------------------
            // CREATE ORDER
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
                "RAZORPAY ORDER CREATED:",
                order.id
            );

            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            return res.json({

                success:
                    true,

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

            return res.status(500).json({

                success:
                    false,

                error:
                    error.message ||
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
            // VALIDATE
            // -----------------------------------------

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Incomplete payment information."

                });

            }

            // -----------------------------------------
            // CHECK SECRET
            // -----------------------------------------

            if (
                !process.env.RAZORPAY_KEY_SECRET
            ) {

                return res.status(500).json({

                    success:
                        false,

                    error:
                        "Razorpay secret key is missing."

                });

            }

            // -----------------------------------------
            // GENERATE SIGNATURE
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
            // COMPARE
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

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Payment verification failed."

                });

            }

            const isValid =
                crypto.timingSafeEqual(
                    generatedBuffer,
                    receivedBuffer
                );

            if (!isValid) {

                console.error(
                    "INVALID RAZORPAY SIGNATURE"
                );

                return res.status(400).json({

                    success:
                        false,

                    error:
                        "Payment verification failed."

                });

            }

            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

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

            return res.json({

                success:
                    true,

                message:
                    "Payment verified successfully.",

                paymentId:
                    razorpay_payment_id,

                orderId:
                    razorpay_order_id

            });

        } catch (error) {

            console.error(
                "PAYMENT VERIFICATION ERROR:",
                error
            );

            return res.status(500).json({

                success:
                    false,

                error:
                    error.message ||
                    "Payment verification failed."

            });

        }

    }
);

// =========================================================
// EXPORT
// =========================================================

module.exports =
    router;