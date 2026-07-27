const express = require("express");
const router = express.Router();
const authFunction = require("../middlewares/auth-filter");
const mapController = require("../controllers/map-controller");

router.route("/").post(authFunction, mapController.salonInRange);

module.exports = router;