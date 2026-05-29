const express = require("express");
const router = express.Router();
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/stats.controller");

router.get("/dashboard", proteger, soloAdmin, ctrl.dashboard);

module.exports = router;
