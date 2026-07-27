const express = require("express");
const router = express.Router();
const authFunction = require("../middlewares/auth-filter");
const salonController = require("../controllers/salon-controller");
const checkRole = require("../middlewares/role-filter");

//salon apis for salon personally
router.route("/profile").get(authFunction, checkRole("SALON_OWNER"), salonController.getSalon).patch(authFunction, checkRole("SALON_OWNER"), salonController.editSalon);
router.route("/staff").get(authFunction, salonController.getStaffs).post(authFunction, checkRole("SALON_OWNER"), salonController.addStaff);
router.route("/staff/:id").patch(authFunction, salonController.editStaff).delete(authFunction, salonController.deleteStaff);
router.route("/service").get(authFunction, salonController.getServices).post(authFunction, checkRole("SALON_OWNER"), salonController.addService);
router.route("/service/:id").patch(authFunction, checkRole("SALON_OWNER"), salonController.editService).delete(authFunction, checkRole("SALON_OWNER"), salonController.deleteService);

//booking and time slots apis
router.route("/slots").get(authFunction, salonController.getSlots);
router.route("/booking").get(authFunction, checkRole("SALON_OWNER"), salonController.getBookings);
router.route("/booking/:id").patch(authFunction, checkRole("SALON_OWNER"), salonController.editBooking);

// OTP verify: salon types the OTP shown by the customer to start service
const otpController = require("../controllers/otp-controller");
router.post("/booking/:id/start", authFunction, checkRole("SALON_OWNER"), otpController.verifyOtpAndStart);

module.exports = router;
