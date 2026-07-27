const prisma = require("../middlewares/prisma-filter");

const salonInRange = async (req, res, next) => {
    try {
        const {lati, long, dist} = req.body;

        const nearbySalons = await prisma.$queryRaw`
            SELECT *,
                (6371 * acos(
                cos(radians(${lati})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${long})) +
                sin(radians(${lati})) * sin(radians(latitude))
                )) AS distance_km
            FROM \`salon\`
            WHERE \`isActive\` = true
            HAVING (6371 * acos(
                cos(radians(${lati})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${long})) +
                sin(radians(${lati})) * sin(radians(latitude))
                )) <= ${dist}
            ORDER BY distance_km ASC;
            `;
        
        return res.status(200).json({nearbySalons});
    } catch (error) {
        next(error);
    }
}

module.exports = {salonInRange};