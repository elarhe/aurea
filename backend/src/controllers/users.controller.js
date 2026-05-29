const User = require("../models/User");
const Address = require("../models/Address");
const bcrypt = require("bcryptjs");

// GET /me — perfil completo del usuario
const miPerfil = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id)
      .populate("addresses")
      .populate("defaultAddress")
      .populate("wishlist", "name slug price coverImage rating");

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    return res.json({ ok: true, usuario });
  } catch (error) {
    console.error("[users.miPerfil]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PUT /me — actualizar perfil
const actualizarPerfil = async (req, res) => {
  try {
    const camposPermitidos = ["firstName", "lastName", "phone", "birthDate", "gender", "newsletter", "walletAddress"];
    const updates = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) updates[campo] = req.body[campo];
    }

    const usuario = await User.findByIdAndUpdate(
      req.usuario.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    return res.json({ ok: true, usuario });
  } catch (error) {
    console.error("[users.actualizarPerfil]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /password — cambiar contraseña
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, nuevaPassword } = req.body;

    if (!passwordActual || !nuevaPassword) {
      return res.status(400).json({ ok: false, mensaje: "passwordActual y nuevaPassword son requeridos" });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ ok: false, mensaje: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    const usuario = await User.findById(req.usuario.id).select("+password");
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const correcto = await usuario.comparePassword(passwordActual);
    if (!correcto) {
      return res.status(401).json({ ok: false, mensaje: "Contraseña actual incorrecta" });
    }

    usuario.password = nuevaPassword;
    await usuario.save();

    return res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("[users.cambiarPassword]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /wishlist — obtener wishlist populada
const miWishlist = async (req, res) => {
  try {
    const usuario = await User.findById(req.usuario.id)
      .populate("wishlist", "name slug price compareAtPrice coverImage rating reviewCount isActive");

    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    return res.json({ ok: true, wishlist: usuario.wishlist });
  } catch (error) {
    console.error("[users.miWishlist]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST /wishlist — toggle producto en wishlist
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ ok: false, mensaje: "productId es requerido" });
    }

    const usuario = await User.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const idx = usuario.wishlist.findIndex((id) => id.toString() === productId);
    let accion;

    if (idx !== -1) {
      usuario.wishlist.splice(idx, 1);
      accion = "removed";
      // Decrementar wishlistCount en el producto
      await require("../models/Product").findByIdAndUpdate(productId, { $inc: { wishlistCount: -1 } });
    } else {
      usuario.wishlist.push(productId);
      accion = "added";
      await require("../models/Product").findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } });
    }

    await usuario.save();

    return res.json({ ok: true, accion, wishlist: usuario.wishlist });
  } catch (error) {
    console.error("[users.toggleWishlist]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /addresses — listar direcciones
const misDirecciones = async (req, res) => {
  try {
    const direcciones = await Address.find({ user: req.usuario.id }).sort({ isDefault: -1, createdAt: -1 });
    return res.json({ ok: true, direcciones });
  } catch (error) {
    console.error("[users.misDirecciones]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST /addresses — crear dirección
const crearDireccion = async (req, res) => {
  try {
    const { recipient, line1, city, postalCode, country } = req.body;

    if (!recipient || !line1 || !city || !postalCode || !country) {
      return res.status(400).json({ ok: false, mensaje: "recipient, line1, city, postalCode y country son requeridos" });
    }

    const direccion = new Address({ ...req.body, user: req.usuario.id });
    await direccion.save();

    // Si es la primera o se marcó como default, actualizar usuario
    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.usuario.id, _id: { $ne: direccion._id } },
        { isDefault: false }
      );
      await User.findByIdAndUpdate(req.usuario.id, { defaultAddress: direccion._id });
    }

    // Añadir al array de addresses del usuario
    await User.findByIdAndUpdate(req.usuario.id, { $addToSet: { addresses: direccion._id } });

    return res.status(201).json({ ok: true, direccion });
  } catch (error) {
    console.error("[users.crearDireccion]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PUT /addresses/:id — actualizar dirección
const actualizarDireccion = async (req, res) => {
  try {
    const direccion = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.usuario.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!direccion) {
      return res.status(404).json({ ok: false, mensaje: "Dirección no encontrada" });
    }

    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.usuario.id, _id: { $ne: direccion._id } },
        { isDefault: false }
      );
      await User.findByIdAndUpdate(req.usuario.id, { defaultAddress: direccion._id });
    }

    return res.json({ ok: true, direccion });
  } catch (error) {
    console.error("[users.actualizarDireccion]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE /addresses/:id — eliminar dirección
const eliminarDireccion = async (req, res) => {
  try {
    const direccion = await Address.findOneAndDelete({ _id: req.params.id, user: req.usuario.id });

    if (!direccion) {
      return res.status(404).json({ ok: false, mensaje: "Dirección no encontrada" });
    }

    await User.findByIdAndUpdate(req.usuario.id, {
      $pull: { addresses: direccion._id },
    });

    return res.json({ ok: true, mensaje: "Dirección eliminada" });
  } catch (error) {
    console.error("[users.eliminarDireccion]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = {
  miPerfil,
  actualizarPerfil,
  cambiarPassword,
  miWishlist,
  toggleWishlist,
  misDirecciones,
  crearDireccion,
  actualizarDireccion,
  eliminarDireccion,
};
