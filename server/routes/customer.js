const express = require("express");
const router = express.Router();
const authFunction = require("../middlewares/auth-filter");
const customerController = require("../controllers/customer-controller");
const paymentController = require("../controllers/payment-controller");
const otpController     = require("../controllers/otp-controller");
const checkRole = require("../middlewares/role-filter");

//Customer personal routes
router.route("/profile").get(authFunction, checkRole("CUSTOMER"), customerController.getCustomer).patch(authFunction, checkRole("CUSTOMER"), customerController.editCustomer);
router.route("/booking").get(authFunction, checkRole("CUSTOMER"), customerController.getBookings).post(authFunction, checkRole("CUSTOMER"), customerController.addBooking);
router.route("/booking/:id/cancel").patch(authFunction, checkRole("CUSTOMER"), customerController.cancelBooking);

// Payment routes
router.post("/payment/order",  authFunction, checkRole("CUSTOMER"), paymentController.createOrder);
router.post("/payment/verify", authFunction, checkRole("CUSTOMER"), paymentController.verifyPayment);
router.post("/payment/cash",   authFunction, checkRole("CUSTOMER"), paymentController.recordCashPayment);

// OTP — customer fetches their OTP to show at the salon
router.get("/booking/:id/otp", authFunction, checkRole("CUSTOMER"), otpController.getCustomerOtp);

module.exports = router;