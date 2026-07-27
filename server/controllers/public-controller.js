const prisma = require("../middlewares/prisma-filter");

const listSalons = async (req, res, next) => {
    try {
        const { city, search, work } = req.query;
        const salons = await prisma.salon.findMany({
            where: {
                isActive: true,
                ...(city && { city: { contains: city } }),
                ...(search && { salonName: { contains: search } }),
                // Filter salons that have at least one active service in the given work category
                ...(work && {
                    services: {
                        some: { work: work, isActive: true }
                    }
                }),
            },
        });
        res.status(200).json({ salons });
    } catch (error) {
        next(error);
    }
};

const getSalonDetails = async (req, res, next) => {
    try {
        const salonId = parseInt(req.params.id);
        const salon = await prisma.salon.findUnique({
            where: { userId: salonId },
            include: {
                services: { where: { isActive: true } },
                staff: { where: { isActive: true } },
            },
        });
        if (!salon) {
            return res.status(404).json({ msg: "Salon not found" });
        }
        res.status(200).json(salon);
    } catch (error) {
        next(error);
    }
};

module.exports = { listSalons, getSalonDetails };
