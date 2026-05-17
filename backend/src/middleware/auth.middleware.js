const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const User = require("../models/User");

// Middleware que verifica el JWT y carga el usuario/empleado en req.usuario
const proteger = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ ok: false, mensaje: "No autorizado — token requerido" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cargar el usuario según el tipo
    if (decoded.tipo === "employee") {
      const empleado = await Employee.findById(decoded.id);
      if (!empleado || !empleado.isActive) {
        return res.status(401).json({ ok: false, mensaje: "No autorizado" });
      }
      req.usuario = {
        id: empleado._id,
        email: empleado.email,
        nombre: `${empleado.firstName || ""} ${empleado.lastName || ""}`.trim(),
        role: empleado.role,
        tipo: "employee",
      };
    } else {
      const usuario = await User.findById(decoded.id);
      if (!usuario || !usuario.isActive) {
        return res.status(401).json({ ok: false, mensaje: "No autorizado" });
      }
      req.usuario = {
        id: usuario._id,
        email: usuario.email,
        nombre: `${usuario.firstName || ""} ${usuario.lastName || ""}`.trim(),
        tipo: "user",
      };
    }

    next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: "Token inválido o expirado" });
  }
};

// Middleware que solo permite admins y managers
const soloAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.tipo !== "employee") {
    return res.status(403).json({ ok: false, mensaje: "Acceso solo para empleados" });
  }
  if (!["admin", "manager"].includes(req.usuario.role)) {
    return res.status(403).json({ ok: false, mensaje: "Se requiere rol admin o manager" });
  }
  next();
};

module.exports = { proteger, soloAdmin };