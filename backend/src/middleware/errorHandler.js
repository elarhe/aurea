const errorHandler = (err, req, res, next) => {
  console.error("[Error]", err.message, err.stack);

  if (err.name === "ValidationError") {
    const mensajes = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ ok: false, mensaje: mensajes.join(", ") });
  }
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || "campo";
    return res.status(409).json({ ok: false, mensaje: `Ya existe un registro con ese ${campo}` });
  }
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({ ok: false, mensaje: "Token inválido o expirado" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ ok: false, mensaje: "ID no válido" });
  }

  const status = err.status || err.statusCode || 500;
  const mensaje = status < 500 ? err.message : "Error interno del servidor";
  res.status(status).json({ ok: false, mensaje });
};

module.exports = errorHandler;
