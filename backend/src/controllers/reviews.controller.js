const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

// GET — listar reviews por producto (paginado)
const listarPorProducto = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Solo reviews aprobadas para público
    const filtro = { product: productId, isApproved: true };

    const [reviews, total] = await Promise.all([
      Review.find(filtro)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "firstName lastName avatar")
        .lean(),
      Review.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      reviews,
    });
  } catch (error) {
    console.error("[reviews.listarPorProducto]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST — crear review (usuario autenticado que haya comprado)
const crear = async (req, res) => {
  try {
    const { productId, rating, title, comment, sizeFeedback, qualityRating, valueRating, images } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ ok: false, mensaje: "productId y rating son requeridos" });
    }

    // Verificar compra del producto
    const pedidoConProducto = await Order.findOne({
      user: req.usuario.id,
      status: { $in: ["delivered", "shipped"] },
      "items.product": productId,
    });

    const verifiedPurchase = !!pedidoConProducto;

    // Solo usuarios que hayan comprado pueden dejar review
    if (!verifiedPurchase) {
      return res.status(403).json({ ok: false, mensaje: "Solo puedes reseñar productos que hayas comprado" });
    }

    // Verificar si ya hay review de este usuario para este producto
    const reviewExistente = await Review.findOne({ product: productId, user: req.usuario.id });
    if (reviewExistente) {
      return res.status(409).json({ ok: false, mensaje: "Ya has escrito una reseña para este producto" });
    }

    const review = new Review({
      product: productId,
      user: req.usuario.id,
      order: pedidoConProducto?._id,
      rating,
      title,
      comment,
      sizeFeedback,
      qualityRating,
      valueRating,
      images,
      verifiedPurchase,
      isApproved: true,
    });

    await review.save();

    // Recalcular rating y reviewCount en el producto
    const allReviews = await Review.find({ product: productId, isApproved: true });
    const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return res.status(201).json({ ok: true, review });
  } catch (error) {
    console.error("[reviews.crear]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/approve — aprobar review (empleados)
const aprobar = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, moderatedBy: req.usuario.id, moderatedAt: new Date() },
      { new: true }
    );

    if (!review) return res.status(404).json({ ok: false, mensaje: "Reseña no encontrada" });

    // Recalcular métricas del producto
    const allReviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return res.json({ ok: true, review });
  } catch (error) {
    console.error("[reviews.aprobar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/reject — rechazar review (empleados)
const rechazar = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: false, moderatedBy: req.usuario.id, moderatedAt: new Date() },
      { new: true }
    );

    if (!review) return res.status(404).json({ ok: false, mensaje: "Reseña no encontrada" });

    // Recalcular métricas del producto
    const allReviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
      : 0;
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return res.json({ ok: true, review });
  } catch (error) {
    console.error("[reviews.rechazar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/reply — respuesta oficial (empleados)
const responder = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ ok: false, mensaje: "message es requerido" });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reply: { message, author: req.usuario.id, repliedAt: new Date() } },
      { new: true }
    );

    if (!review) return res.status(404).json({ ok: false, mensaje: "Reseña no encontrada" });

    return res.json({ ok: true, review });
  } catch (error) {
    console.error("[reviews.responder]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE /:id — eliminar review (empleados)
const eliminar = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ ok: false, mensaje: "Reseña no encontrada" });

    // Recalcular métricas del producto
    const allReviews = await Review.find({ product: review.product, isApproved: true });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
      : 0;
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length,
    });

    return res.json({ ok: true, mensaje: "Reseña eliminada" });
  } catch (error) {
    console.error("[reviews.eliminar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = { listarPorProducto, crear, aprobar, rechazar, responder, eliminar };
