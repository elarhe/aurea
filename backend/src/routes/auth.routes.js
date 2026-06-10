const express = require("express");
const router = express.Router();
const { loginEmpleado, loginCliente, registroCliente, crearAdmin, me } = require("../controllers/auth.controller");
const { proteger, soloAdmin } = require("../middleware/auth.middleware");
const { loginLimiter, registroLimiter } = require("../middleware/rateLimiter");

router.post("/empleados/login", loginLimiter, loginEmpleado);
router.post("/clientes/login", loginLimiter, loginCliente);
router.post("/clientes/registro", registroLimiter, registroCliente);
router.post("/empleados/crear", proteger, soloAdmin, crearAdmin);
router.get("/me", proteger, me);

module.exports = router;
