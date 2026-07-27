const express = require("express");
const router = express.Router();
const authFunction = require("../middlewares/auth-filter");
const publicController = require("../controllers/public-controller");

router.get("/", publicController.listSalons);
router.get("/:id", authFunction, publicController.getSalonDetails);

module.exports = router;
