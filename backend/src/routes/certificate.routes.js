const express = require("express");
const router = express.Router();
const {
  emitirCertificado,
  obtenerCertificado,
  verificarCertificado,
  listarCertificadosUsuario,
  listarTodos,
  qrCertificado,
  migrarCertificadosPedidos,
  reEmitirPendientes,
} = require("../controllers/certificate.controller");
const { proteger, soloAdmin } = require("../middleware/auth.middleware");

// ── Rutas públicas (sin autenticación) ──────────────────────────────────────
// Verificación pública por slug o serial number
router.get("/verificar/:slug", verificarCertificado);
// QR de verificación pública (devuelve PNG)
router.get("/qr/:slug", qrCertificado);

// ── Rutas de cliente autenticado ────────────────────────────────────────────
router.get("/mis-certificados", proteger, listarCertificadosUsuario);
router.get("/:id", proteger, obtenerCertificado);

// ── Rutas de empleado (admin/manager) ───────────────────────────────────────
router.get("/", proteger, soloAdmin, listarTodos);
router.post("/emitir", proteger, soloAdmin, emitirCertificado);
router.post("/migrar", proteger, soloAdmin, migrarCertificadosPedidos);
router.post("/re-emitir", proteger, soloAdmin, reEmitirPendientes);

module.exports = router;
