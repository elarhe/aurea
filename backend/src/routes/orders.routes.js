const express = require("express");
const router = express.Router();
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/orders.controller");

router.post("/", proteger, ctrl.crearPedido);
router.get("/mis-pedidos", proteger, ctrl.listarMisPedidos);
router.get("/mis-pedidos/:id", proteger, ctrl.obtenerMiPedido);
router.get("/", proteger, soloAdmin, ctrl.listarTodos);
router.get("/:id", proteger, soloAdmin, ctrl.obtenerPedido);
router.patch("/:id/status", proteger, soloAdmin, ctrl.cambiarEstado);
router.patch("/:id/assign", proteger, soloAdmin, ctrl.asignarEmpleado);

module.exports = router;
