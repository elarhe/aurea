const express = require("express");
const router = express.Router();
const { proteger } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/cart.controller");

// Todas las rutas del carrito requieren autenticación
router.use(proteger);

router.get("/", ctrl.obtenerCarrito);
router.post("/items", ctrl.agregarItem);
router.patch("/items", ctrl.actualizarItem);
router.delete("/items/:itemId", ctrl.eliminarItem);
router.delete("/", ctrl.vaciarCarrito);
router.post("/coupon", ctrl.aplicarCupon);
router.delete("/coupon", ctrl.eliminarCupon);

module.exports = router;
