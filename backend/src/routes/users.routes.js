const express = require("express");
const router = express.Router();
const { proteger } = require("../middleware/auth.middleware");
const ctrl = require("../controllers/users.controller");

// Todas las rutas de usuario requieren autenticación
router.use(proteger);

router.get("/me", ctrl.miPerfil);
router.put("/me", ctrl.actualizarPerfil);
router.patch("/password", ctrl.cambiarPassword);
router.get("/wishlist", ctrl.miWishlist);
router.post("/wishlist", ctrl.toggleWishlist);
router.get("/addresses", ctrl.misDirecciones);
router.post("/addresses", ctrl.crearDireccion);
router.put("/addresses/:id", ctrl.actualizarDireccion);
router.delete("/addresses/:id", ctrl.eliminarDireccion);

const { soloAdmin } = require("../middleware/auth.middleware");
router.get("/", proteger, soloAdmin, ctrl.listarUsuarios);

router.delete("/:id", proteger, soloAdmin, ctrl.eliminarUsuario);



module.exports = router;
