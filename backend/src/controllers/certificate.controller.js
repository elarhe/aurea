/**
 * CertificateController - Lógica de negocio para certificados blockchain.
 *
 * Flujo principal:
 *   1. El backend llama a emitirCertificado() tras confirmar el pago de un pedido.
 *   2. El certificado queda guardado en MongoDB (modelo Certificate) con su txHash.
 *   3. Cualquiera puede verificarlo públicamente por serialNumber o publicSlug.
 */
const Certificate = require("../models/Certificate");
const Order = require("../models/Order");
const blockchainService = require("../services/blockchain.service");
const { customAlphabet } = require("nanoid");

// Generador de slug público corto (8 chars, solo letras y números)
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

// ─── Emitir certificado ────────────────────────────────────────────────────

/**
 * POST /api/v1/certificates/emitir
 * Body: { orderId, orderItemId }
 * Requiere: empleado autenticado (admin/manager) O proceso interno del backend.
 *
 * Emite un certificado on-chain para un item concreto de un pedido.
 * Si el item ya tiene certificado, devuelve el existente.
 */
const emitirCertificado = async (req, res) => {
  try {
    const { orderId, orderItemId } = req.body;

    if (!orderId || !orderItemId) {
      return res.status(400).json({ ok: false, mensaje: "orderId y orderItemId son obligatorios" });
    }

    // Cargar el pedido con sus relaciones
    const order = await Order.findById(orderId).populate("user").populate("items.product");
    if (!order) {
      return res.status(404).json({ ok: false, mensaje: "Pedido no encontrado" });
    }

    // Solo se certifica si el pedido está pagado o en proceso
    if (!["paid", "processing", "shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({ ok: false, mensaje: `No se puede certificar un pedido en estado "${order.status}"` });
    }

    // Localizar el item
    const item = order.items.id(orderItemId);
    if (!item) {
      return res.status(404).json({ ok: false, mensaje: "Item no encontrado en el pedido" });
    }

    // ¿Ya tiene certificado?
    if (item.certificate) {
      const certExistente = await Certificate.findById(item.certificate);
      if (certExistente && certExistente.status === "issued") {
        return res.json({ ok: true, certificado: certExistente, yaExistia: true });
      }
    }

    const product = item.product;
    const user = order.user;

    // Número de serie único
    const serialNumber = blockchainService.constructor.generateSerialNumber
      ? blockchainService.constructor.generateSerialNumber()
      : require("../services/blockchain.service").constructor.generateSerialNumber();

    // Generar serialNumber usando la función estática
    const BlockchainService = require("../services/blockchain.service").constructor;
    const serial = `AUREA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2,10).toUpperCase()}`;

    // Dirección del propietario (si el usuario no tiene wallet, usamos su email como hash)
    const ownerAddress = user.walletAddress || blockchainService.constructor.emailToAddress(user.email);

    // Crear registro en BD en estado "pending" antes de llamar al contrato
    const publicSlug = nanoid();
    const cert = await Certificate.create({
      serialNumber: serial,
      product: product._id,
      productName: item.productName,
      order: order._id,
      user: user._id,
      productSnapshot: {
        brand: product.brand || "Aurea",
        materials: product.materials || [],
        countryOfOrigin: product.countryOfOrigin || "",
        images: product.images || [],
      },
      network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
      contractAddress: process.env.AUREACERT_CONTRACT_ADDRESS || "",
      transactionHash: "pending",
      issuerAddress: "",
      ownerAddress,
      publicSlug,
      status: "pending",
    });

    // Llamada al smart contract
    let onChain;
    try {
      onChain = await blockchainService.issueCertificate({
        productId: product._id.toString(),
        productName: item.productName,
        serialNumber: serial,
        ownerAddress,
        metadataURI: "",
      });
    } catch (blockchainError) {
      // Actualizar el certificado como fallido
      cert.status = "failed";
      cert.error = blockchainError.message;
      await cert.save();
      console.error("[Certificate] Error on-chain:", blockchainError.message);
      return res.status(502).json({ ok: false, mensaje: "Error al emitir en blockchain", error: blockchainError.message });
    }

    // Actualizar el certificado con los datos on-chain
    cert.certificateId = onChain.certId;
    cert.transactionHash = onChain.txHash;
    cert.blockNumber = onChain.blockNumber;
    cert.issuerAddress = onChain.issuerAddress;
    cert.contractAddress = onChain.contractAddress;
    cert.issuedAt = onChain.issuedAt;
    cert.gasUsed = onChain.gasUsed;
    cert.gasPriceWei = onChain.gasPriceWei;
    cert.status = "issued";
    await cert.save();

    // Actualizar el item del pedido con la referencia al certificado
    item.certificate = cert._id;
    const todosEmitidos = order.items.every((i) => i.certificate != null);
    order.certificatesIssued = todosEmitidos;
    await order.save();

    return res.status(201).json({ ok: true, certificado: cert });
  } catch (error) {
    console.error("[Certificate] Error emitirCertificado:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── Obtener certificado por ID (MongoDB) ─────────────────────────────────

/**
 * GET /api/v1/certificates/:id
 * Requiere autenticación. El cliente solo puede ver sus propios certificados.
 */
const obtenerCertificado = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("product", "name images coverImage brand")
      .populate("order", "orderNumber createdAt total");

    if (!cert) return res.status(404).json({ ok: false, mensaje: "Certificado no encontrado" });

    // Los clientes solo ven sus propios certificados
    if (req.usuario.tipo === "user" && cert.user.toString() !== req.usuario.id.toString()) {
      return res.status(403).json({ ok: false, mensaje: "No autorizado" });
    }

    // Incrementar contador de verificación
    cert.verificationCount += 1;
    cert.lastVerifiedAt = new Date();
    await cert.save();

    res.json({ ok: true, certificado: cert });
  } catch (error) {
    console.error("[Certificate] Error obtenerCertificado:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── Verificación pública (sin autenticación) ─────────────────────────────

/**
 * GET /api/v1/certificates/verificar/:slug
 * Público. Verifica el certificado en BD y también consulta on-chain para
 * confirmar que la información coincide (prueba de inmutabilidad).
 */
const verificarCertificado = async (req, res) => {
  try {
    const { slug } = req.params;

    // Buscar por publicSlug o por serialNumber
    const cert = await Certificate.findOne({
      $or: [{ publicSlug: slug }, { serialNumber: slug }],
    }).populate("product", "name images coverImage brand sustainabilityBadges");

    if (!cert) {
      return res.status(404).json({ ok: false, mensaje: "Certificado no encontrado" });
    }

    // Construir la respuesta base (datos en BD)
    const respuesta = {
      ok: true,
      certificado: {
        id: cert._id,
        certificateId: cert.certificateId,
        serialNumber: cert.serialNumber,
        productName: cert.productName,
        product: cert.product,
        productSnapshot: cert.productSnapshot,
        ownerAddress: cert.ownerAddress,
        issuedAt: cert.issuedAt,
        network: cert.network,
        contractAddress: cert.contractAddress,
        transactionHash: cert.transactionHash,
        blockNumber: cert.blockNumber,
        status: cert.status,
      },
      onChain: null,
      verified: false,
    };

    // Consulta on-chain para verificación cruzada
    if (cert.status === "issued" && cert.serialNumber) {
      try {
        const onChainData = await blockchainService.getCertificateBySerial(cert.serialNumber);
        respuesta.onChain = onChainData;
        // Verificación: comprobamos que el serialNumber y productId coinciden
        respuesta.verified =
          onChainData.serialNumber === cert.serialNumber &&
          onChainData.productId === cert.product._id.toString();
      } catch (bcError) {
        // Si no se puede consultar la blockchain, avisamos pero no fallamos
        respuesta.onChainError = "No se pudo consultar la blockchain en este momento";
      }
    }

    // Actualizar contador
    cert.verificationCount += 1;
    cert.lastVerifiedAt = new Date();
    await cert.save();

    res.json(respuesta);
  } catch (error) {
    console.error("[Certificate] Error verificarCertificado:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── Listar certificados del usuario autenticado ──────────────────────────

/**
 * GET /api/v1/certificates/mis-certificados
 * Requiere autenticación de cliente.
 */
const listarCertificadosUsuario = async (req, res) => {
  try {
    const certs = await Certificate.find({ user: req.usuario.id, status: "issued" })
      .populate("product", "name images coverImage brand")
      .populate("order", "orderNumber createdAt total")
      .sort({ issuedAt: -1 });

    res.json({ ok: true, total: certs.length, certificados: certs });
  } catch (error) {
    console.error("[Certificate] Error listarCertificadosUsuario:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// ─── Listar todos (solo empleados) ───────────────────────────────────────

/**
 * GET /api/v1/certificates
 * Requiere autenticación de empleado.
 */
const listarTodos = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, network } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filtro = {};
    if (status) filtro.status = status;
    if (network) filtro.network = network;

    const [certs, total] = await Promise.all([
      Certificate.find(filtro)
        .populate("user", "firstName lastName email")
        .populate("product", "name coverImage")
        .populate("order", "orderNumber total")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Certificate.countDocuments(filtro),
    ]);

    res.json({
      ok: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      certificados: certs,
    });
  } catch (error) {
    console.error("[Certificate] Error listarTodos:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  emitirCertificado,
  obtenerCertificado,
  verificarCertificado,
  listarCertificadosUsuario,
  listarTodos,
};
