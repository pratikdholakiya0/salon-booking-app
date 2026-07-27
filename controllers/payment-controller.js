const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../middlewares/prisma-filter");
const { adjustScore, POINTS } = require("../utils/loyalty");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/customer/payment/order
// Creates a Razorpay order for a given booking
const createOrder = async (req, res, next) => {
    try {
        const { bookingId } = req.body;
        const customerId = req.userData.id;

        // Fetch booking with service price
        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: { service: true },
        });

        if (!booking) {
            return res.status(404).json({ msg: "Booking not found" });
        }

        if (booking.customerId !== customerId) {
            return res.status(403).json({ msg: "Not your booking" });
        }

        // Amount in paise (Razorpay uses smallest currency unit)
        const amountPaise = Math.round(parseFloat(booking.service.price) * 100);

        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: "INR",
            receipt: `booking_${bookingId}`,
            notes: {
                bookingId: bookingId.toString(),
                customerId: customerId.toString(),
            },
        });

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/customer/payment/verify
// Verifies Razorpay signature and records payment in DB
const verifyPayment = async (req, res, next) => {
    try {
        const {
            bookingId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        // Verify HMAC signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ msg: "Payment verification failed. Invalid signature." });
        }

        // Fetch booking for amount
        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: { service: true },
        });

        if (!booking) {
            return res.status(404).json({ msg: "Booking not found" });
        }

        // Record payment
        await prisma.payment.create({
            data: {
                bookingId: parseInt(bookingId),
                amount: booking.service.price,
                method: "ONLINE",
                status: "PAID",
                transactionId: razorpay_payment_id,
                paidAt: new Date(),
            },
        });

        // Award loyalty points for online payment (+2)
        await adjustScore(booking.customerId, POINTS.ONLINE_PAYMENT);

        res.status(200).json({ msg: "Payment successful", paymentId: razorpay_payment_id });
    } catch (error) {
        next(error);
    }
};

// POST /api/customer/payment/cash
// Records a CASH payment intent (status PENDING until salon confirms)
const recordCashPayment = async (req, res, next) => {
    try {
        const { bookingId } = req.body;
        const customerId = req.userData.id;

        const booking = await prisma.booking.findUnique({
            where: { id: parseInt(bookingId) },
            include: { service: true },
        });

        if (!booking) return res.status(404).json({ msg: "Booking not found" });
        if (booking.customerId !== customerId) return res.status(403).json({ msg: "Not your booking" });

        // Check if payment already exists
        const existing = await prisma.payment.findUnique({ where: { bookingId: parseInt(bookingId) } });
        if (existing) return res.status(409).json({ msg: "Payment already recorded" });

        await prisma.payment.create({
            data: {
                bookingId: parseInt(bookingId),
                amount: booking.service.price,
                method: "CASH",
                status: "PENDING",
                paidAt: new Date(),
            },
        });

        res.status(201).json({ msg: "Cash payment recorded. Pay at the salon." });
    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, verifyPayment, recordCashPayment };
