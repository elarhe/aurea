const express = require("express");
const router = express.Router();
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/coupons.controller");

router.post("/validate", ctrl.validar); // público (no requiere auth para validar)
router.get("/", proteger, soloAdmin, ctrl.listar);
router.post("/", proteger, soloAdmin, ctrl.crear);
router.put("/:id", proteger, soloAdmin, ctrl.actualizar);
router.patch("/:id/deactivate", proteger, soloAdmin, ctrl.desactivar);

module.exports = router;
