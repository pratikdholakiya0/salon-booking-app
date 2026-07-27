const prisma = require("../middlewares/prisma-filter");
const { adjustScore, cancelDelta } = require("../utils/loyalty");
const { timeToMins } = require("../utils/addMinutes");

/* ─── Per-slot mutex ───────────────────────────────────────────────────────
 * Key format: "<salonId>:<staffId|any>:<date>:<startTime>"
 * When two requests race for the same slot, the second waits for the first
 * to finish before it checks availability — eliminating the TOCTOU window.
 * ────────────────────────────────────────────────────────────────────────── */
const slotLocks = new Map(); // key → Promise chain

const withSlotLock = (key, fn) => {
    const prev = slotLocks.get(key) || Promise.resolve();
    const next = prev.then(fn).catch(fn); // always advance chain even on error
    slotLocks.set(key, next.finally(() => {
        if (slotLocks.get(key) === next) slotLocks.delete(key);
    }));
    return next;
};

const getCustomer = async (req, res, next) => {
    try {
        const userData = req.userData;
        const customerData = await prisma.customer.findUnique({where: {userId: userData.id}});
        if(!customerData) {
            return res.status(404).json({msg: "Customer not found"});
        }
        return res.status(200).json(customerData);
    } catch (error) {
        next(error);
    }
}

const editCustomer = async (req, res, next) => {
    try {
        const {name, phone, profileUrl} = req.body;
        const updatedCustomer = await prisma.user.update({
            where: {id: req.userData.id},
            data: {
                name,
                phone,
                customer: {
                    update: {
                        profileUrl
                    }
                }
            },
            include: {
                customer: true
            }
        });
        return res.status(200).json(updatedCustomer);
    } catch (error) {
        next(error);
    }
}

//create booking
const addBooking = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        const { salonId, serviceId, staffId, startTime, date, notes } = req.body;

        // Block unverified customers from booking
        const userRecord = await prisma.user.findUnique({
            where: { id: customerId },
            select: { isEmailVerified: true },
        });
        if (!userRecord?.isEmailVerified) {
            return res.status(403).json({
                msg: "Please verify your email address before booking.",
                code: "EMAIL_NOT_VERIFIED",
            });
        }

        // Fetch service duration outside the lock — read-only, no race risk
        const service = await prisma.service.findUnique({ where: { id: parseInt(serviceId) } });
        if (!service) return res.status(404).json({ msg: "Service not found" });

        const bookingDate    = new Date(date);
        const requestedStart = timeToMins(startTime);
        const requestedEnd   = requestedStart + service.duration;

        // Enforce 2-day booking window — can only book today, tomorrow, or day-after
        const today    = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate  = new Date(today);
        maxDate.setDate(today.getDate() + 2);
        const slotDay  = new Date(bookingDate);
        slotDay.setHours(0, 0, 0, 0);

        if (slotDay < today) {
            return res.status(400).json({ msg: "Cannot book a slot in the past." });
        }
        if (slotDay > maxDate) {
            return res.status(400).json({ msg: "Bookings can only be made up to 2 days in advance." });
        }

        // Mutex key — scoped to salon + staff (or "any") + date + startTime
        const lockKey = `${salonId}:${staffId || 'any'}:${bookingDate.toISOString().split('T')[0]}:${startTime}`;

        // Run the conflict-check + insert as one serialized, atomic unit
        const result = await withSlotLock(lockKey, async () => {
            return await prisma.$transaction(async (tx) => {
                // Re-check inside the transaction with SERIALIZABLE isolation
                const conflicts = await tx.booking.findMany({
                    where: {
                        salonId: parseInt(salonId),
                        date:    bookingDate,
                        status:  { notIn: ["CANCELLED"] },
                        ...(staffId ? { staffId: parseInt(staffId) } : {}),
                    },
                    include: { service: true },
                });

                const hasConflict = conflicts.some((b) => {
                    const existStart = timeToMins(b.startTime);
                    const existEnd   = existStart + b.service.duration;
                    return requestedStart < existEnd && requestedEnd > existStart;
                });

                if (hasConflict) {
                    // Return a sentinel — we can't throw here without rolling back
                    return { conflict: true };
                }

                const newBooking = await tx.booking.create({
                    data: {
                        customerId,
                        salonId:   parseInt(salonId),
                        serviceId: parseInt(serviceId),
                        staffId:   staffId ? parseInt(staffId) : null,
                        startTime,
                        date:      bookingDate,
                        notes:     notes || null,
                    },
                });

                return { booking: newBooking };
            }, {
                isolationLevel: 'Serializable', // prevent phantom reads at DB level
                timeout: 10000,
            });
        });

        if (result.conflict) {
            return res.status(409).json({ msg: "This time slot is already booked. Please choose another slot." });
        }

        res.status(201).json({
            msg: "Booking request created.",
            booking: result.booking,
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};

//view bookings
const getBookings = async (req, res, next) => {
    try {
        const customerId = req.userData.id;
        
        const allBookings = await prisma.booking.findMany({where: {customerId}});

        res.status(200).json({allBookings});

    } catch (error) {
        next(error);
    }
}

//cancel booking (cancel)
const cancelBooking = async (req, res, next) => {
    try {
        const bookingId  = parseInt(req.params.id);
        const customerId = req.userData.id;

        // Fetch booking first so we can calculate the time-based penalty
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (!booking || booking.customerId !== customerId) {
            return res.status(404).json({ msg: "Booking not found or cannot be cancelled." });
        }

        if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(booking.status)) {
            return res.status(400).json({ msg: "Booking not found or cannot be cancelled." });
        }

        const delta = cancelDelta(booking.date, booking.startTime);

        await prisma.$transaction([
            prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status:      "CANCELLED",
                    cancelledBy: "CUSTOMER",
                    cancelledAt: new Date(),
                },
            }),
        ]);

        // Loyalty adjustment outside transaction — avoids timeout
        await adjustScore(customerId, delta);   // -10

        res.status(200).json({ msg: "Booking cancelled successfully." });
    } catch (error) {
        next(error);
    }
}

module.exports = {getCustomer, editCustomer, addBooking, getBookings, cancelBooking};