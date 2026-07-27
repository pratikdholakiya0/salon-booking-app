const prisma = require("../middlewares/prisma-filter");
const {addMinutes, timeToMins} = require("../utils/addMinutes");
const { adjustScore, POINTS } = require("../utils/loyalty");

//salon functions
const getSalon = async (req, res, next) => {
    try {
        const userData = req.userData;
        const salonData = await prisma.salon.findUnique({where: {userId: userData.id}});
        if(!salonData) {
            return res.status(404).json({msg: "Salon not found"});
        }
        return res.status(200).json(salonData);
    } catch (error) {
        next(error);
    }
}

const editSalon = async (req, res, next) => {
    try {
        const {
            name,
            phone,
            salonName,
            bio,
            profileUrl,
            address,
            city,
            pincode,
            closingTime,
            openingTime,
            slotInterval
        } = req.body;

        const updatedSalon = await prisma.user.update({
            where: {
                id: req.userData.id
            },
            data: {
                name,
                phone,
                salon: {
                    update: {
                        salonName,
                        bio: bio || null,
                        profileUrl: profileUrl || null,
                        address,
                        city,
                        pincode: pincode || null,
                        openingTime,
                        closingTime,
                        slotInterval: Number(slotInterval)
                    }
                }
            },
            include: {
                salon: true
            }
        });

        return res.status(200).json(updatedSalon);

    } catch (error) {
        console.error(error);
        next(error);
    }
};

//staff functions
const getStaffs = async (req, res, next) => {
    try {
        const userData = req.userData;
        const staffData = await prisma.staff.findMany({
            where: {salonId: userData.id}
        });
        res.status(200).json({staffData});
    } catch (error) {
        next(error);
    }
}

const addStaff = async (req, res, next) => {
    try {
        const {phone, name, role, profileUrl} = req.body;
        const newStaff = await prisma.staff.create({
            data: {
                salonId: req.userData.id,
                phone,
                name,
                role,
                profileUrl
            }
        });
        res.status(201).json(newStaff);
    } catch (error) {
        next(error);
    }
}

const editStaff = async (req, res, next) => {
    try {
        const {phone, name, role, profileUrl} = req.body;
        const staffId = parseInt(req.params.id);
        const newStaff = await prisma.staff.update({
            where: {id: staffId, salonId: req.userData.id},
            data: {
                phone,
                name,
                role,
                profileUrl
            }
        });
        res.status(201).json(newStaff);
    } catch (error) {
        next(error);
    }
}

const deleteStaff = async (req, res, next) => {
    try {
        const staffId = parseInt(req.params.id);
        const deletedStaff = await prisma.staff.delete({
            where: {id: staffId, salonId: req.userData.id},
        });
        res.status(200).json(deletedStaff);
    } catch (error) {
        next(error);
    }
}

//service functions
const getServices = async (req, res, next) => {
    try {
        const serviceData = await prisma.service.findMany({
            where: {salonId: req.userData.id}
        });
        res.status(200).json({serviceData});
    } catch (error) {
        next(error);
    }
}

const addService = async (req, res, next) => {
    try {
        const {name, work, description, duration, price} = req.body;
        const newService = await prisma.service.create({
            data: {
                salonId: req.userData.id, name, work, description, duration, price
            }
        });
        res.status(201).json(newService);
    } catch (error) {
        next(error);
    }
}

const editService = async (req, res, next) => {
    try {
        const {name, work, description, duration, price} = req.body;
        const serviceId = parseInt(req.params.id);
        const updatedService = await prisma.service.update({
            where: {id: serviceId},
            data: {
                name, work, description, duration, price
            }
        });
        res.status(200).json(updatedService);
    } catch (error) {
        next(error);
    }
}

const deleteService = async (req, res, next) => {
    try {
        const serviceId = parseInt(req.params.id);
        const deletedService = await prisma.service.delete({
            where: {id: serviceId, salonId: req.userData.id}
        });
        res.status(200).json(deletedService);
    } catch (error) {
        next(error);
    }
}

//time slot function
const getSlots = async (req, res, next) => {
    try {
        const now = new Date();
        const {date, staffId, salonId} = req.query;

        // Use the requested date for the DB query (keep as Date object)
        const targetDate = date ? new Date(date) : now;

        // Compare dates as YYYY-MM-DD strings to avoid timezone issues
        const todayStr  = now.toISOString().split('T')[0];
        const queryStr  = targetDate.toISOString().split('T')[0];
        const isToday   = todayStr === queryStr;

        // Cutoff = current time + 2 hours, expressed as total minutes from midnight
        // Only applied when booking for today — future dates have no cutoff
        const nowMins    = now.getHours() * 60 + now.getMinutes();
        const cutoffMins = isToday ? nowMins + 120 : 0;

        const salon = await prisma.salon.findUnique({where: {userId: parseInt(salonId)}});
        if (!salon) return res.status(404).json({ msg: "Salon not found" });

        // Generate all slots for the day
        const slots = [];
        let current = salon.openingTime;
        while (current < salon.closingTime) {
            slots.push({
                startTime: current,
                endTime: addMinutes(current, salon.slotInterval)
            });
            current = addMinutes(current, salon.slotInterval);
        }

        // Fetch existing bookings for that day
        const bookings = await prisma.booking.findMany({
            where: {
                salonId: parseInt(salonId),
                date: targetDate,
                status: {not: "CANCELLED"},
                ...(staffId && {staffId: parseInt(staffId)})
            },
            include: {service: true}
        });

        const bookedSlots = bookings.map(b => ({
            startTime: timeToMins(b.startTime),
            endTime:   timeToMins(b.startTime) + b.service.duration
        }));

        const freeSlots = slots.filter((slot) => {
            const begin = timeToMins(slot.startTime);
            const end   = timeToMins(slot.endTime);

            // Drop slots that start within the next 2 hours (today only)
            if (isToday && begin < cutoffMins) return false;

            // Drop already-booked slots
            return !bookedSlots.some(b => begin < b.endTime && end > b.startTime);
        });

        res.status(200).json({freeSlots});
    } catch (error) {
        next(error);
    }
}

//Booking functions
const getBookings = async (req, res, next) => {
    try {
        const salonId = req.userData.id;
        const bookings = await prisma.booking.findMany({
            where: { salonId },
            include: {
                service: { select: { name: true } },
                staff:   { select: { name: true } },
                customer: {
                    include: {
                        user: { select: { name: true, phone: true, email: true } }
                    }
                }
            },
            orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
        });
        res.status(200).json({ bookings });
    } catch (error) {
        next(error);
    }
}

const editBooking = async (req, res, next) => {
    try {
        const bookingId = parseInt(req.params.id, 10);
        const {status} = req.body;
        const allowedStatus = ["CONFIRMED", "CANCELLED", "NO_SHOW"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({ msg: "Invalid status. Must be CONFIRMED, CANCELLED, or NO_SHOW." });
        }

        // Fetch booking so we can read customerId for loyalty adjustment
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.salonId !== req.userData.id) {
            return res.status(404).json({ msg: "Booking not found or not yours." });
        }

        const validFromStatuses = status === "NO_SHOW" ? ["CONFIRMED"] : ["PENDING"];
        if (!validFromStatuses.includes(booking.status)) {
            return res.status(400).json({ msg: "Booking not found, not yours or already processed." });
        }

        // For NO_SHOW: enforce that 15 minutes have passed since appointment start
        if (status === "NO_SHOW") {
            const [h, m]   = booking.startTime.split(':').map(Number);
            const apptTime = new Date(booking.date);
            apptTime.setHours(h, m, 0, 0);
            const minsElapsed = (Date.now() - apptTime) / 60000;

            if (minsElapsed < 15) {
                const waitMins = Math.ceil(15 - minsElapsed);
                return res.status(400).json({
                    msg: `You can only mark a customer as No Show 15 minutes after the appointment start. Please wait ${waitMins} more minute${waitMins !== 1 ? 's' : ''}.`,
                    waitMinutes: waitMins,
                });
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status,
                    ...(status === "CANCELLED" && {
                        cancelledBy: "SALON_OWNER",
                        cancelledAt: new Date(),
                    }),
                },
            });
        });

        // Loyalty adjustment outside transaction — avoids interactive-transaction timeout
        if (status === "NO_SHOW") {
            await adjustScore(booking.customerId, POINTS.NO_SHOW);  // -20
        }

        res.status(200).json({ msg: `Booking ${status.toLowerCase().replace('_', ' ')} successfully.` });
    } catch (error) {
        next(error);
    }
}

module.exports = {getSalon, editSalon, getStaffs, addStaff, editStaff, deleteStaff, getServices, addService, editService, deleteService, getSlots, getBookings, editBooking};