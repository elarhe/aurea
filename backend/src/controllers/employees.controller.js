const Employee = require("../models/Employee");

// GET / — listar empleados (admin)
const listar = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, role } = req.query;
    const filtro = {};

    if (q) {
      filtro.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    if (role) filtro.role = role;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [empleados, total] = await Promise.all([
      Employee.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Employee.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      empleados,
    });
  } catch (error) {
    console.error("[employees.listar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /:id — obtener empleado
const obtener = async (req, res) => {
  try {
    const empleado = await Employee.findById(req.params.id);
    if (!empleado) {
      return res.status(404).json({ ok: false, mensaje: "Empleado no encontrado" });
    }
    return res.json({ ok: true, empleado });
  } catch (error) {
    console.error("[employees.obtener]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST / — crear empleado (admin)
const crear = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: "firstName, lastName, email y password son requeridos" });
    }

    const empleado = new Employee({ ...req.body });
    await empleado.save();

    return res.status(201).json({ ok: true, empleado });
  } catch (error) {
    console.error("[employees.crear]", error);
    if (error.code === 11000) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un empleado con ese email" });
    }
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PUT /:id — actualizar empleado (admin)
const actualizar = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // No actualizar contraseña por aquí

    const empleado = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!empleado) {
      return res.status(404).json({ ok: false, mensaje: "Empleado no encontrado" });
    }

    return res.json({ ok: true, empleado });
  } catch (error) {
    console.error("[employees.actualizar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/toggle — activar/desactivar empleado
const toggleEstado = async (req, res) => {
  try {
    const empleado = await Employee.findById(req.params.id);
    if (!empleado) {
      return res.status(404).json({ ok: false, mensaje: "Empleado no encontrado" });
    }

    empleado.isActive = !empleado.isActive;
    await empleado.save();

    return res.json({ ok: true, empleado, isActive: empleado.isActive });
  } catch (error) {
    console.error("[employees.toggleEstado]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = { listar, obtener, crear, actualizar, toggleEstado };
