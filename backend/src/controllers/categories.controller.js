const Category = require("../models/Category");

const toSlug = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET / — todas las categorías activas en árbol padre/hijo
const listar = async (req, res) => {
  try {
    const todas = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();

    // Construir árbol
    const mapa = {};
    const raices = [];

    for (const cat of todas) {
      mapa[cat._id.toString()] = { ...cat, children: [] };
    }
    for (const cat of todas) {
      if (cat.parent) {
        const parentId = cat.parent.toString();
        if (mapa[parentId]) {
          mapa[parentId].children.push(mapa[cat._id.toString()]);
        } else {
          raices.push(mapa[cat._id.toString()]);
        }
      } else {
        raices.push(mapa[cat._id.toString()]);
      }
    }

    return res.json({ ok: true, categorias: raices });
  } catch (error) {
    console.error("[categories.listar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// GET /:slug — obtener por slug
const obtener = async (req, res) => {
  try {
    const categoria = await Category.findOne({ slug: req.params.slug, isActive: true })
      .populate("parent", "name slug");

    if (!categoria) {
      return res.status(404).json({ ok: false, mensaje: "Categoría no encontrada" });
    }

    return res.json({ ok: true, categoria });
  } catch (error) {
    console.error("[categories.obtener]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// POST / — crear (solo admin)
const crear = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ ok: false, mensaje: "El campo name es requerido" });
    }

    const slug = req.body.slug || toSlug(name);
    const categoria = new Category({ ...req.body, slug });
    await categoria.save();

    return res.status(201).json({ ok: true, categoria });
  } catch (error) {
    console.error("[categories.crear]", error);
    if (error.code === 11000) {
      return res.status(409).json({ ok: false, mensaje: "Ya existe una categoría con ese nombre o slug" });
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

    const categoria = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!categoria) {
      return res.status(404).json({ ok: false, mensaje: "Categoría no encontrada" });
    }

    return res.json({ ok: true, categoria });
  } catch (error) {
    console.error("[categories.actualizar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

// DELETE /:id — soft delete (solo admin)
const eliminar = async (req, res) => {
  try {
    const categoria = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!categoria) {
      return res.status(404).json({ ok: false, mensaje: "Categoría no encontrada" });
    }

    return res.json({ ok: true, mensaje: "Categoría desactivada" });
  } catch (error) {
    console.error("[categories.eliminar]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
