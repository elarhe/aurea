const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Certificate = require("../models/Certificate");
const blockchainService = require("../services/blockchain.service");

const generarOrderNumber = () =>
  "ORD-" + new Date().getFullYear() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();

const generarSerialNumber = () =>
  "AUREA-" + new Date().getFullYear() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();

// POST / — crear pedido desde el carrito
const crearPedido = async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentProvider = "manual", customerNotes, isGift, giftMessage } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ ok: false, mensaje: "shippingAddress es requerido" });
    }

    const carrito = await Cart.findOne({ user: req.usuario.id })
      .populate("items.product");

    if (!carrito || carrito.items.length === 0) {
      return res.status(400).json({ ok: false, mensaje: "El carrito está vacío" });
    }

    // Construir items del pedido con snapshot de precios
    const items = [];
    for (const item of carrito.items) {
      const producto = item.product;
      if (!producto || !producto.isActive) {
        return res.status(400).json({ ok: false, mensaje: `Producto no disponible: ${item.variantSku}` });
      }
      const variante = producto.variants.find((v) => v.sku === item.variantSku);
      if (!variante) {
        return res.status(400).json({ ok: false, mensaje: `Variante no encontrada: ${item.variantSku}` });
      }
      if (variante.stock < item.quantity) {
        return res.status(400).json({ ok: false, mensaje: `Stock insuficiente para: ${producto.name}` });
      }

      const unitPrice = item.unitPrice;
      items.push({
        product: producto._id,
        productName: producto.name,
        sku: item.variantSku,
        variant: { size: variante.size, color: variante.color },
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
        image: producto.coverImage || (producto.images && producto.images[0]),
      });

      // Descontar stock
      variante.stock -= item.quantity;
      await producto.save();
    }

    const subtotal = items.reduce((acc, it) => acc + it.subtotal, 0);
    const discount = carrito.discount || 0;
    const shippingCost = carrito.estimatedShipping || 0;
    const total = Math.max(0, subtotal - discount + shippingCost);

    let orderNumber = generarOrderNumber();
    // Asegurar unicidad
    let intentos = 0;
    while (intentos < 5) {
      const existe = await Order.findOne({ orderNumber });
      if (!existe) break;
      orderNumber = generarOrderNumber();
      intentos++;
    }

    const pedido = new Order({
      orderNumber,
      user: req.usuario.id,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      subtotal,
      discount,
      shippingCost,
      total,
      couponCode: carrito.couponCode,
      payment: { provider: paymentProvider, status: "pending" },
      customerNotes,
      isGift: isGift || false,
      giftMessage,
      statusHistory: [{ status: "pending", changedAt: new Date() }],
    });

    await pedido.save();

    // Limpiar carrito
    await Cart.findOneAndUpdate(
      { user: req.usuario.id },
      { items: [], subtotal: 0, discount: 0, couponCode: null, estimatedTotal: 0 }
    );

    // Para testing/manual: cambiar a "paid" y emitir certificados
    if (paymentProvider === "manual") {
      pedido.status = "paid";
      pedido.payment.status = "succeeded";
      pedido.payment.paidAt = new Date();
      pedido.statusHistory.push({ status: "paid", changedAt: new Date() });
      await pedido.save();

      // Emitir certificados blockchain para items certificables
      const ownerAddress = req.body.walletAddress ||
        blockchainService.constructor.emailToAddress
          ? blockchainService.constructor.emailToAddress(req.usuario.email)
          : blockchainService.emailToAddress
          ? blockchainService.emailToAddress(req.usuario.email)
          : req.usuario.email;

      let certificadosEmitidos = 0;
      for (const item of pedido.items) {
        const producto = await Product.findById(item.product);
        if (!producto || !producto.certifiable) continue;

        try {
          const serialNumber = generarSerialNumber();
          const resultado = await blockchainService.issueCertificate({
            productId: item.product.toString(),
            productName: item.productName,
            serialNumber,
            ownerAddress: typeof ownerAddress === "string" ? ownerAddress : ownerAddress,
            metadataURI: "",
          });

          const cert = new Certificate({
            certificateId: resultado.certId,
            serialNumber,
            product: item.product,
            productName: item.productName,
            order: pedido._id,
            user: req.usuario.id,
            productSnapshot: {
              brand: producto.brand,
              materials: producto.materials,
              countryOfOrigin: producto.countryOfOrigin,
              images: producto.images,
            },
            network: resultado.network,
            contractAddress: resultado.contractAddress,
            transactionHash: resultado.txHash,
            blockNumber: resultado.blockNumber,
            issuerAddress: resultado.issuerAddress,
            ownerAddress: typeof ownerAddress === "string" ? ownerAddress : ownerAddress,
            status: "issued",
            issuedAt: resultado.issuedAt,
            gasUsed: resultado.gasUsed,
            gasPriceWei: resultado.gasPriceWei,
          });

          await cert.save();

          // Enlazar certificado al item del pedido
          await Order.updateOne(
            { _id: pedido._id, "items._id": item._id },
            { $set: { "items.$.certificate": cert._id } }
          );

          certificadosEmitidos++;
        } catch (blockchainError) {
          console.error("[orders.crearPedido] Error emitiendo certificado blockchain:", blockchainError);
          // No interrumpir el flujo del pedido
        }
      }

      if (certificadosEmitidos > 0) {
        pedido.certificatesIssued = true;
        await pedido.save();
      }
    }

    const pedidoFinal = await Order.findById(pedido._id).populate("items.certificate");
    return res.status(201).json({ ok: true, pedido: pedidoFinal });
  } catch (error) {
    console.error("[orders.crearPedido]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /mis-pedidos — pedidos del usuario autenticado
const listarMisPedidos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [pedidos, total] = await Promise.all([
      Order.find({ user: req.usuario.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("items.certificate", "serialNumber status transactionHash")
        .lean(),
      Order.countDocuments({ user: req.usuario.id }),
    ]);

    return res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      pedidos,
    });
  } catch (error) {
    console.error("[orders.listarMisPedidos]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /mis-pedidos/:id — obtener pedido propio
const obtenerMiPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const filtro = req.usuario.tipo === "employee"
      ? { $or: [{ _id: id }, { orderNumber: id }] }
      : { $or: [{ _id: id }, { orderNumber: id }], user: req.usuario.id };

    const pedido = await Order.findOne(filtro)
      .populate("items.product", "name slug coverImage")
      .populate("items.certificate");

    if (!pedido) {
      return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    }

    return res.json({ ok: true, pedido });
  } catch (error) {
    console.error("[orders.obtenerMiPedido]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET / — listar todos los pedidos (empleados)
const listarTodos = async (req, res) => {
  try {
    const { status, dateFrom, dateTo, q, page = 1, limit = 20 } = req.query;
    const filtro = {};

    if (status) filtro.status = status;
    if (dateFrom || dateTo) {
      filtro.createdAt = {};
      if (dateFrom) filtro.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filtro.createdAt.$lte = new Date(dateTo);
    }
    if (q) {
      filtro.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [pedidos, total] = await Promise.all([
      Order.find(filtro)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "firstName lastName email")
        .lean(),
      Order.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      pedidos,
    });
  } catch (error) {
    console.error("[orders.listarTodos]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /:id — obtener pedido completo (empleados)
const obtenerPedido = async (req, res) => {
  try {
    const pedido = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email phone")
      .populate("items.product", "name slug coverImage")
      .populate("items.certificate")
      .populate("employeeAssigned", "firstName lastName email");

    if (!pedido) {
      return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    }

    return res.json({ ok: true, pedido });
  } catch (error) {
    console.error("[orders.obtenerPedido]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/status — cambiar estado (solo admin)
const cambiarEstado = async (req, res) => {
  try {
    const { status, note } = req.body;
    const estadosValidos = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

    if (!status || !estadosValidos.includes(status)) {
      return res.status(400).json({ ok: false, mensaje: "Estado no válido" });
    }

    const pedido = await Order.findById(req.params.id);
    if (!pedido) {
      return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    }

    pedido.status = status;
    pedido.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.usuario.id,
      note: note || "",
    });

    await pedido.save();
    return res.json({ ok: true, pedido });
  } catch (error) {
    console.error("[orders.cambiarEstado]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/assign — asignar empleado (solo admin)
const asignarEmpleado = async (req, res) => {
  try {
    const { empleadoId } = req.body;

    const pedido = await Order.findByIdAndUpdate(
      req.params.id,
      { employeeAssigned: empleadoId },
      { new: true }
    ).populate("employeeAssigned", "firstName lastName email");

    if (!pedido) {
      return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    }

    return res.json({ ok: true, pedido });
  } catch (error) {
    console.error("[orders.asignarEmpleado]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = {
  crearPedido,
  listarMisPedidos,
  obtenerMiPedido,
  listarTodos,
  obtenerPedido,
  cambiarEstado,
  asignarEmpleado,
};
