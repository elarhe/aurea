const express = require("express");
const router = express.Router();
const {
  loginEmpleado,
  loginCliente,
  registroCliente,
  crearAdmin,
  me,
} = require("../controllers/auth.controller");
const { proteger, soloAdmin } = require("../middleware/auth.middleware");

// Empleados (backoffice)
router.post("/empleados/login", loginEmpleado);

// Clientes (tienda)
router.post("/clientes/login", loginCliente);
router.post("/clientes/registro", registroCliente);

// Setup de admins — protegido, solo admin existente puede crear otros
router.post("/empleados/crear", proteger, soloAdmin, crearAdmin);

// Perfil del usuario autenticado
router.get("/me", proteger, me);

module.exports = router;