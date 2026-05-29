const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");

const recalcularCarrito = (carrito) => {
  carrito.subtotal = carrito.items.reduce(
    (acc, it) => acc + it.unitPrice * it.quantity,
    0
  );
  carrito.estimatedTotal = Math.max(0, carrito.subtotal - carrito.discount + carrito.estimatedShipping);
};

// GET / — obtener carrito del usuario
const obtenerCarrito = async (req, res) => {
  try {
    let carrito = await Cart.findOne({ user: req.usuario.id })
      .populate("items.product", "name slug coverImage price variants isActive");

    if (!carrito) {
      carrito = await Cart.create({ user: req.usuario.id, items: [] });
    }

    return res.json({ ok: true, carrito });
  } catch (error) {
    console.error("[cart.obtenerCarrito]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST /items — agregar item
const agregarItem = async (req, res) => {
  try {
    const { productId, variantSku, quantity = 1 } = req.body;

    if (!productId || !variantSku) {
      return res.status(400).json({ ok: false, mensaje: "productId y variantSku son requeridos" });
    }

    const producto = await Product.findById(productId);
    if (!producto || !producto.isActive) {
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    const variante = producto.variants.find((v) => v.sku === variantSku);
    if (!variante) {
      return res.status(404).json({ ok: false, mensaje: "Variante no encontrada" });
    }

    let carrito = await Cart.findOne({ user: req.usuario.id });
    if (!carrito) {
      carrito = new Cart({ user: req.usuario.id, items: [] });
    }

    const itemExistente = carrito.items.find((it) => it.variantSku === variantSku);
    const cantidadTotal = itemExistente ? itemExistente.quantity + quantity : quantity;

    if (variante.stock < cantidadTotal) {
      return res.status(400).json({ ok: false, mensaje: "Stock insuficiente" });
    }

    const unitPrice = variante.priceOverride || producto.price;

    if (itemExistente) {
      itemExistente.quantity += quantity;
      itemExistente.unitPrice = unitPrice;
    } else {
      carrito.items.push({ product: productId, variantSku, quantity, unitPrice });
    }

    recalcularCarrito(carrito);
    await carrito.save();
    await carrito.populate("items.product", "name slug coverImage price variants isActive");

    return res.json({ ok: true, carrito });
  } catch (error) {
    console.error("[cart.agregarItem]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /items — actualizar cantidad de un item
const actualizarItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined) {
      return res.status(400).json({ ok: false, mensaje: "itemId y quantity son requeridos" });
    }

    const carrito = await Cart.findOne({ user: req.usuario.id });
    if (!carrito) {
      return res.status(404).json({ ok: false, mensaje: "Carrito no encontrado" });
    }

    const idx = carrito.items.findIndex((it) => it._id.toString() === itemId);
    if (idx === -1) {
      return res.status(404).json({ ok: false, mensaje: "Item no encontrado" });
    }

    if (quantity <= 0) {
      carrito.items.splice(idx, 1);
    } else {
      carrito.items[idx].quantity = quantity;
    }

    recalcularCarrito(carrito);
    await carrito.save();
    await carrito.populate("items.product", "name slug coverImage price variants isActive");

    return res.json({ ok: true, carrito });
  } catch (error) {
    console.error("[cart.actualizarItem]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE /items/:itemId — eliminar item
const eliminarItem = async (req, res) => {
  try {
    const carrito = await Cart.findOne({ user: req.usuario.id });
    if (!carrito) {
      return res.status(404).json({ ok: false, mensaje: "Carrito no encontrado" });
    }

    const idx = carrito.items.findIndex((it) => it._id.toString() === req.params.itemId);
    if (idx === -1) {
      return res.status(404).json({ ok: false, mensaje: "Item no encontrado" });
    }

    carrito.items.splice(idx, 1);
    recalcularCarrito(carrito);
    await carrito.save();

    return res.json({ ok: true, carrito });
  } catch (error) {
    console.error("[cart.eliminarItem]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE / — vaciar carrito
const vaciarCarrito = async (req, res) => {
  try {
    const carrito = await Cart.findOneAndUpdate(
      { user: req.usuario.id },
      { items: [], subtotal: 0, discount: 0, couponCode: null, estimatedTotal: 0 },
      { new: true }
    );

    return res.json({ ok: true, carrito });
  } catch (error) {
    console.error("[cart.vaciarCarrito]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST /coupon — aplicar cupón
const aplicarCupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ ok: false, mensaje: "code es requerido" });
    }

    const carrito = await Cart.findOne({ user: req.usuario.id });
    if (!carrito) {
      return res.status(404).json({ ok: false, mensaje: "Carrito no encontrado" });
    }

    const cupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!cupon) {
      return res.status(404).json({ ok: false, mensaje: "Cupón no válido" });
    }

    const ahora = new Date();
    if (cupon.validFrom && ahora < cupon.validFrom) {
      return res.status(400).json({ ok: false, mensaje: "El cupón aún no es válido" });
    }
    if (cupon.validUntil && ahora > cupon.validUntil) {
      return res.status(400).json({ ok: false, mensaje: "El cupón ha expirado" });
    }
    if (cupon.usageLimit && cupon.usageCount >= cupon.usageLimit) {
      return res.status(400).json({ ok: false, mensaje: "El cupón ha alcanzado su límite de uso" });
    }
    if (carrito.subtotal < cupon.minPurchase) {
      return res.status(400).json({
        ok: false,
        mensaje: `Compra mínima requerida: ${cupon.minPurchase}€`,
      });
    }

    let descuento = 0;
    if (cupon.discountType === "percentage") {
      descuento = (carrito.subtotal * cupon.discountValue) / 100;
      if (cupon.maxDiscount) descuento = Math.min(descuento, cupon.maxDiscount);
    } else {
      descuento = cupon.discountValue;
    }
    descuento = Math.min(descuento, carrito.subtotal);

    carrito.couponCode = cupon.code;
    carrito.discount = descuento;
    recalcularCarrito(carrito);
    await carrito.save();

    return res.json({ ok: true, descuento, carrito });
  } catch (error) {
    console.error("[cart.aplicarCupon]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE /coupon — eliminar cupón
const eliminarCupon = async (req, res) => {
  try {
    const carrito = await Cart.findOne({ user: req.usuario.id });
    if (!carrito) {
      return res.status(404).json({ ok: false, mensaje: "Carrito no encontrado" });
    }

    carrito.couponCode = undefined;
    carrito.discount = 0;
    recalcularCarrito(carrito);
    await carrito.save();

    return res.json({ ok: true, carrito });
  } catch (error) {
    console.error("[cart.eliminarCupon]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = {
  obtenerCarrito,
  agregarItem,
  actualizarItem,
  eliminarItem,
  vaciarCarrito,
  aplicarCupon,
  eliminarCupon,
};
