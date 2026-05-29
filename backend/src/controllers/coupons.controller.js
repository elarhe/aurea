const Coupon = require("../models/Coupon");

// POST /validate — validar cupón sin usarlo
const validar = async (req, res) => {
  try {
    const { code, orderTotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ ok: false, mensaje: "code es requerido" });
    }

    const cupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!cupon) {
      return res.status(404).json({ ok: false, mensaje: "Cupón no válido o inactivo" });
    }

    const ahora = new Date();
    if (cupon.validFrom && ahora < cupon.validFrom) {
      return res.status(400).json({ ok: false, mensaje: "El cupón aún no está activo" });
    }
    if (cupon.validUntil && ahora > cupon.validUntil) {
      return res.status(400).json({ ok: false, mensaje: "El cupón ha expirado" });
    }
    if (cupon.usageLimit && cupon.usageCount >= cupon.usageLimit) {
      return res.status(400).json({ ok: false, mensaje: "El cupón ha alcanzado su límite de uso" });
    }
    if (orderTotal < cupon.minPurchase) {
      return res.status(400).json({
        ok: false,
        mensaje: `Compra mínima requerida: ${cupon.minPurchase}€`,
        minPurchase: cupon.minPurchase,
      });
    }

    let descuento = 0;
    if (cupon.discountType === "percentage") {
      descuento = (orderTotal * cupon.discountValue) / 100;
      if (cupon.maxDiscount) descuento = Math.min(descuento, cupon.maxDiscount);
    } else {
      descuento = cupon.discountValue;
    }
    descuento = Math.min(descuento, orderTotal);

    return res.json({
      ok: true,
      descuento,
      tipo: cupon.discountType,
      valor: cupon.discountValue,
      freeShipping: cupon.freeShipping,
      codigo: cupon.code,
    });
  } catch (error) {
    console.error("[coupons.validar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET / — listar cupones (admin)
const listar = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const filtro = {};

    if (q) {
      filtro.$or = [
        { code: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [cupones, total] = await Promise.all([
      Coupon.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Coupon.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      cupones,
    });
  } catch (error) {
    console.error("[coupons.listar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST / — crear cupón (admin)
const crear = async (req, res) => {
  try {
    const { code, discountType, discountValue } = req.body;

    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ ok: false, mensaje: "code, discountType y discountValue son requeridos" });
    }

    const cupon = new Coupon({ ...req.body, code: code.toUpperCase() });
    await cupon.save();

    return res.status(201).json({ ok: true, cupon });
  } catch (error) {
    console.error("[coupons.crear]", error);
    if (error.code === 11000) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un cupón con ese código" });
    }
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PUT /:id — actualizar cupón (admin)
const actualizar = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.code) updates.code = updates.code.toUpperCase();

    const cupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!cupon) {
      return res.status(404).json({ ok: false, mensaje: "Cupón no encontrado" });
    }

    return res.json({ ok: true, cupon });
  } catch (error) {
    console.error("[coupons.actualizar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/deactivate — desactivar cupón (admin)
const desactivar = async (req, res) => {
  try {
    const cupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!cupon) {
      return res.status(404).json({ ok: false, mensaje: "Cupón no encontrado" });
    }

    return res.json({ ok: true, mensaje: "Cupón desactivado", cupon });
  } catch (error) {
    console.error("[coupons.desactivar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = { validar, listar, crear, actualizar, desactivar };
