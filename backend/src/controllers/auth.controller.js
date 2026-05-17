const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const User = require("../models/User");

// Genera un JWT firmado
const generarToken = (id, tipo) => {
  return jwt.sign({ id, tipo }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// ─── LOGIN EMPLEADOS (panel backoffice) ────────────────────────────
const loginEmpleado = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: "Email y contraseña son obligatorios" });
    }

    // Buscar empleado e incluir el password (select: false por defecto)
    const empleado = await Employee.findOne({ email: email.toLowerCase() }).select("+password");

    if (!empleado || !empleado.isActive) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales incorrectas" });
    }

    // const passwordOk = await bcrypt.compare(password, empleado.password);
    const passwordOk = await empleado.comparePassword(password);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales incorrectas" });
    }

    // Actualizar último login
    empleado.lastLoginAt = new Date();
    empleado.loginCount = (empleado.loginCount || 0) + 1;
    await empleado.save();

    const token = generarToken(empleado._id, "employee");

    res.json({
      ok: true,
      token,
      empleado: {
        id: empleado._id,
        email: empleado.email,
        nombre: `${empleado.firstName || ""} ${empleado.lastName || ""}`.trim() || empleado.email,
        role: empleado.role,
        avatar: empleado.avatar || null,
        department: empleado.department || null,
        jobTitle: empleado.jobTitle || null,
      },
    });
  } catch (error) {
    console.error("[Auth] Error login empleado:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── LOGIN CLIENTES (tienda) ────────────────────────────────────────
const loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, mensaje: "Email y contraseña son obligatorios" });
    }

    const usuario = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!usuario || !usuario.isActive) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales incorrectas" });
    }

    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk) {
      return res.status(401).json({ ok: false, mensaje: "Credenciales incorrectas" });
    }

    usuario.lastLoginAt = new Date();
    usuario.loginCount = (usuario.loginCount || 0) + 1;
    await usuario.save();

    const token = generarToken(usuario._id, "user");

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: `${usuario.firstName || ""} ${usuario.lastName || ""}`.trim(),
        avatar: usuario.avatar || null,
      },
    });
  } catch (error) {
    console.error("[Auth] Error login cliente:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── REGISTRO CLIENTES ───────────────────────────────────────────────
const registroCliente = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: "Nombre, email y contraseña son obligatorios" });
    }

    const existe = await User.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe una cuenta con ese email" });
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = await User.create({
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      password: passwordHash,
      isActive: true,
      emailVerified: false,
    });

    const token = generarToken(usuario._id, "user");

    res.status(201).json({
      ok: true,
      token,
      usuario: {
        id: usuario._id,
        email: usuario.email,
        nombre: `${usuario.firstName} ${usuario.lastName}`.trim(),
      },
    });
  } catch (error) {
    console.error("[Auth] Error registro:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── CREAR ADMIN (solo para setup inicial) ──────────────────────────
const crearAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = "admin" } = req.body;

    const existe = await Employee.findOne({ email: email.toLowerCase() });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un empleado con ese email" });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const empleado = await Employee.create({
      firstName,
      lastName: lastName || "",
      email: email.toLowerCase(),
      password: passwordHash,
      role,
      isActive: true,
    });

    res.status(201).json({
      ok: true,
      empleado: { id: empleado._id, email: empleado.email, role: empleado.role },
    });
  } catch (error) {
    console.error("[Auth] Error crear admin:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── ME (obtener usuario autenticado) ───────────────────────────────
const me = async (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
};

module.exports = { loginEmpleado, loginCliente, registroCliente, crearAdmin, me };