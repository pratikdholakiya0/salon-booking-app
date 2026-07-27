/**
 * Loyalty score rules:
 *   Appointment completed        +5
 *   Online payment               +2
 *   Customer leaves a review     +1
 *   Cancel > 24 h before          0
 *   Cancel 2–24 h before         -5
 *   No show                     -20
 *   Salon cancels                  0
 */

const prisma = require('../middlewares/prisma-filter');

const POINTS = {
    COMPLETED:        5,
    ONLINE_PAYMENT:   2,
    REVIEW:           1,
    LATE_ARRIVAL:    -5,   // verified OTP but arrived > 5 min after appointment time
    CANCEL_EARLY:     0,   // customer cancels > 24 h before
    CANCEL_LATE:    -10,   // customer cancels < 24 h before (flat rule)
    NO_SHOW:        -20,   // did not appear after 15 min
    SALON_CANCEL:     0,
};

/**
 * Adjust a customer's loyalty score.
 * @param {number} customerId  - The customer's userId
 * @param {number} delta       - Points to add (negative to subtract)
 * @param {object} [tx]        - Optional Prisma transaction client
 */
const adjustScore = async (customerId, delta, tx) => {
    if (delta === 0) return;                       // skip no-ops
    const client = tx || prisma;
    await client.customer.update({
        where: { userId: customerId },
        data:  { loyaltyScore: { increment: delta } },
    });
};

/**
 * Calculate the penalty when a customer cancels a booking.
 * @param {Date} bookingDate   - The date of the appointment (Date object)
 * @param {string} startTime   - "HH:MM" start time of the appointment
 * @returns {number} delta points (0 or -5)
 */
const cancelDelta = (bookingDate, startTime) => {
    return -10;  // flat -10 on every customer cancellation
};

module.exports = { adjustScore, cancelDelta, POINTS };
