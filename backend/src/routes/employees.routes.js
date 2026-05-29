const express = require("express");
const router = express.Router();
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/employees.controller");

router.use(proteger, soloAdmin);

router.get("/", ctrl.listar);
router.get("/:id", ctrl.obtener);
router.post("/", ctrl.crear);
router.put("/:id", ctrl.actualizar);
router.patch("/:id/toggle", ctrl.toggleEstado);

module.exports = router;
