/**
 * Modelo Product - Catálogo de productos de moda de Aurea.
 * Incluye variantes (talla/color), stock, imágenes y SEO.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    size: { type: String, trim: true }, // XS, S, M, L, XL, XXL, 36, 38...
    color: { type: String, trim: true },
    colorHex: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    priceOverride: { type: Number, min: 0 }, // si esta variante tiene precio distinto
    images: [{ type: String, trim: true }],
  },
  { _id: true, timestamps: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, trim: true, maxlength: 280 },

    brand: { type: String, trim: true, default: "Aurea" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    tags: [{ type: String, trim: true, lowercase: true }],

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 }, // precio antes de descuento
    currency: { type: String, default: "EUR" },
    taxRate: { type: Number, default: 21 }, // % IVA

    images: [{ type: String, trim: true }],
    coverImage: { type: String, trim: true },

    variants: [variantSchema],
    stock: { type: Number, default: 0, min: 0 }, // stock total agregado
    materials: [{ type: String, trim: true }],
    careInstructions: { type: String, trim: true },
    countryOfOrigin: { type: String, trim: true },

    // Certificación blockchain
    certifiable: { type: Boolean, default: true },

    // SEO
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },

    // Estado
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },

    // Métricas
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

// Antes de guardar, recalcula el stock total a partir de las variantes
productSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
