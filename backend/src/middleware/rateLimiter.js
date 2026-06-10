const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: "Demasiados intentos. Inténtalo de nuevo en 15 minutos." },
});

exports.registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: "Demasiados registros desde esta IP. Inténtalo más tarde." },
});
