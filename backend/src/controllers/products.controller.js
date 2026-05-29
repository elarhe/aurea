const Product = require("../models/Product");

const toSlug = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET / — listar con filtros y paginación
const listar = async (req, res) => {
  try {
    const {
      category, gender, priceMin, priceMax, sort,
      q, tags, isNew, isFeatured, page = 1, limit = 20,
    } = req.query;

    const filtro = { isActive: true };

    if (category) {
      // Buscar categoría por slug primero
      const Category = require("../models/Category");
      const cat = await Category.findOne({ slug: category, isActive: true });
      if (cat) filtro.category = cat._id;
    }
    if (gender) filtro.gender = gender;
    if (priceMin || priceMax) {
      filtro.price = {};
      if (priceMin) filtro.price.$gte = Number(priceMin);
      if (priceMax) filtro.price.$lte = Number(priceMax);
    }
    if (q) filtro.$text = { $search: q };
    if (tags) filtro.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (isNew === "true") filtro.isNew = true;
    if (isFeatured === "true") filtro.isFeatured = true;

    let sortObj = { createdAt: -1 };
    if (sort === "price_asc") sortObj = { price: 1 };
    else if (sort === "price_desc") sortObj = { price: -1 };
    else if (sort === "newest") sortObj = { createdAt: -1 };
    else if (sort === "rating") sortObj = { rating: -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [productos, total] = await Promise.all([
      Product.find(filtro)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate("category", "name slug")
        .lean(),
      Product.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      productos,
    });
  } catch (error) {
    console.error("[products.listar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /:slug — obtener por slug
const obtener = async (req, res) => {
  try {
    const producto = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate("category", "name slug")
      .populate("relatedProducts", "name slug price coverImage rating");

    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    // Incrementar viewCount sin esperar
    Product.findByIdAndUpdate(producto._id, { $inc: { viewCount: 1 } }).exec();

    return res.json({ ok: true, producto });
  } catch (error) {
    console.error("[products.obtener]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST / — crear (solo admin)
const crear = async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ ok: false, mensaje: "name, description, price y category son requeridos" });
    }

    const slug = req.body.slug || toSlug(name);

    const producto = new Product({ ...req.body, slug });
    await producto.save();

    return res.status(201).json({ ok: true, producto });
  } catch (error) {
    console.error("[products.crear]", error);
    if (error.code === 11000) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe un producto con ese slug o SKU" });
    }
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PUT /:id — actualizar (solo admin)
const actualizar = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.name && !updates.slug) {
      updates.slug = toSlug(updates.name);
    }

    const producto = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    return res.json({ ok: true, producto });
  } catch (error) {
    console.error("[products.actualizar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE /:id — soft delete (solo admin)
const eliminar = async (req, res) => {
  try {
    const producto = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    return res.json({ ok: true, mensaje: "Producto desactivado" });
  } catch (error) {
    console.error("[products.eliminar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// PATCH /:id/stock — ajustar stock de variantes por SKU
const actualizarStock = async (req, res) => {
  try {
    const { ajustes } = req.body; // [{ sku, stock }]
    if (!Array.isArray(ajustes) || ajustes.length === 0) {
      return res.status(400).json({ ok: false, mensaje: "Se requiere array 'ajustes' con { sku, stock }" });
    }

    const producto = await Product.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    }

    for (const { sku, stock } of ajustes) {
      const variante = producto.variants.find((v) => v.sku === sku);
      if (variante) {
        variante.stock = Math.max(0, Number(stock));
      }
    }

    await producto.save(); // pre-save recalcula stock total

    return res.json({ ok: true, producto });
  } catch (error) {
    console.error("[products.actualizarStock]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, actualizarStock };
