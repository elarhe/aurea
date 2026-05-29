const express = require("express");
const router = express.Router();
const {
  emitirCertificado,
  obtenerCertificado,
  verificarCertificado,
  listarCertificadosUsuario,
  listarTodos,
} = require("../controllers/certificate.controller");
const { proteger, soloAdmin } = require("../middleware/auth.middleware");

// ── Rutas públicas (sin autenticación) ──────────────────────────────────────
// Verificación pública por slug o serial number
router.get("/verificar/:slug", verificarCertificado);

// ── Rutas de cliente autenticado ────────────────────────────────────────────
router.get("/mis-certificados", proteger, listarCertificadosUsuario);
router.get("/:id", proteger, obtenerCertificado);

// ── Rutas de empleado (admin/manager) ───────────────────────────────────────
router.get("/", proteger, soloAdmin, listarTodos);
router.post("/emitir", proteger, soloAdmin, emitirCertificado);

module.exports = router;
