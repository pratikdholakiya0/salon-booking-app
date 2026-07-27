const prisma = require("../middlewares/prisma-filter");
const { adjustScore, POINTS } = require("../utils/loyalty");

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * GET /api/customer/booking/:id/otp
 * Customer calls this to get their OTP to show at the salon.
 * OTP is only generated within 5 minutes of the appointment time.
 */
const getCustomerOtp = async (req, res, next) => {
    try {
        const bookingId  = parseInt(req.params.id);
        const customerId = req.userData.id;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking)                          return res.status(404).json({ msg: "Booking not found" });
        if (booking.customerId !== customerId) return res.status(403).json({ msg: "Not your booking" });
        if (booking.status !== "CONFIRMED")    return res.status(400).json({ msg: "OTP only available for confirmed bookings" });

        // Build the appointment datetime from booking.date + booking.startTime ("HH:MM")
        const [hours, mins] = booking.startTime.split(':').map(Number);
        const apptDateTime  = new Date(booking.date);
        apptDateTime.setHours(hours, mins, 0, 0);

        const now           = new Date();
        const msUntilAppt   = apptDateTime - now;
        const FIVE_MIN_MS   = 5 * 60 * 1000;

        // Block if more than 5 minutes away
        if (msUntilAppt > FIVE_MIN_MS) {
            const totalMins = Math.ceil(msUntilAppt / 60000);
            const days  = Math.floor(totalMins / (60 * 24));
            const hrs   = Math.floor((totalMins % (60 * 24)) / 60);
            const mins  = totalMins % 60;
            const parts = [];
            if (days) parts.push(`${days}d`);
            if (hrs)  parts.push(`${hrs}h`);
            if (mins) parts.push(`${mins}m`);
            const timeStr = parts.join(' ') || 'less than a minute';
            return res.status(400).json({
                msg: `OTP will be available 5 minutes before your appointment. Come back in ${timeStr}.`,
                minutesUntilAvailable: totalMins,
            });
        }

        // Block if appointment has already passed (more than 60 min ago — safety buffer)
        if (msUntilAppt < -60 * 60 * 1000) {
            return res.status(400).json({ msg: "Appointment time has passed." });
        }

        const existing = await prisma.bookingOtp.findUnique({ where: { bookingId } });

        // Return existing OTP if still valid and unused
        if (existing && !existing.used && new Date() < existing.expiresAt) {
            return res.status(200).json({ otp: existing.otp, expiresAt: existing.expiresAt });
        }

        // Generate fresh OTP — valid for 2 hours from now
        const otp       = generateOtpCode();
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

        await prisma.bookingOtp.upsert({
            where:  { bookingId },
            update: { otp, expiresAt, used: false },
            create: { bookingId, otp, expiresAt },
        });

        res.status(200).json({ otp, expiresAt });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/salon/booking/:id/start
 * Salon owner enters the OTP the customer shows them.
 * Verifies it and marks booking as COMPLETED.
 */
const verifyOtpAndStart = async (req, res, next) => {
    try {
        const bookingId = parseInt(req.params.id);
        const salonId   = req.userData.id;
        const { otp }   = req.body;

        if (!otp) return res.status(400).json({ msg: "OTP is required" });

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking)                    return res.status(404).json({ msg: "Booking not found" });
        if (booking.salonId !== salonId) return res.status(403).json({ msg: "Not your booking" });
        if (booking.status !== "CONFIRMED") return res.status(400).json({ msg: "Booking must be CONFIRMED to start" });

        const record = await prisma.bookingOtp.findUnique({ where: { bookingId } });
        if (!record)             return res.status(404).json({ msg: "No OTP found. Ask customer to open their booking card." });
        if (record.used)         return res.status(400).json({ msg: "OTP already used" });
        if (record.otp !== otp)  return res.status(400).json({ msg: "Invalid OTP" });
        if (new Date() > record.expiresAt) return res.status(400).json({ msg: "OTP expired. Ask customer to refresh their booking." });

        // Determine if customer is late (arrived > 5 min after appointment start)
        const [h, m]   = booking.startTime.split(':').map(Number);
        const apptTime = new Date(booking.date);
        apptTime.setHours(h, m, 0, 0);

        const minsLate = Math.floor((Date.now() - apptTime) / 60000);
        const isLate   = minsLate > 5;   // more than 5 min after appointment start

        // Mark OTP used + booking COMPLETED atomically
        await prisma.$transaction([
            prisma.bookingOtp.update({ where: { bookingId }, data: { used: true } }),
            prisma.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } }),
        ]);

        // Award loyalty points outside transaction
        await adjustScore(booking.customerId, POINTS.COMPLETED);          // +5 for completing
        if (isLate) {
            await adjustScore(booking.customerId, POINTS.LATE_ARRIVAL);   // -5 for being late
        }

        const msg = isLate
            ? `OTP verified. Booking completed. Customer was ${minsLate} minute${minsLate !== 1 ? 's' : ''} late — 5 loyalty points deducted.`
            : "OTP verified. Service started and booking marked as completed.";

        res.status(200).json({ msg, late: isLate, minsLate: isLate ? minsLate : 0 });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCustomerOtp, verifyOtpAndStart };
