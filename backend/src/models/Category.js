/**
 * Modelo Category - Categorías y subcategorías de productos.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    bannerImage: { type: String, trim: true }, // imagen de cabecera ancha
    icon: { type: String, trim: true }, // icono pequeño para menús

    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }, // destacada en home
    order: { type: Number, default: 0 },

    // SEO
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    metaKeywords: [{ type: String, trim: true }],

    // Métricas (denormalizadas, refresco periódico)
    productCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, order: 1 });

module.exports = mongoose.model("Category", categorySchema);
