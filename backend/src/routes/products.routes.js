const express = require("express");
const router = express.Router();
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/products.controller");

router.get("/", ctrl.listar);
router.get("/:slug", ctrl.obtener);
router.post("/", proteger, soloAdmin, ctrl.crear);
router.put("/:id", proteger, soloAdmin, ctrl.actualizar);
router.delete("/:id", proteger, soloAdmin, ctrl.eliminar);
router.patch("/:id/stock", proteger, soloAdmin, ctrl.actualizarStock);

module.exports = router;
