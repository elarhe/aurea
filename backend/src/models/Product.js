/**
 * Modelo Product - Catálogo de productos de moda de Aurea.
 * Incluye variantes (talla/color), stock, imágenes y SEO.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, trim: true }, // EAN-13 / UPC
    size: { type: String, trim: true }, // XS, S, M, L, XL, XXL, 36, 38...
    color: { type: String, trim: true },
    colorHex: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 }, // stock comprometido en carritos
    lowStockThreshold: { type: Number, default: 3 },
    priceOverride: { type: Number, min: 0 }, // si esta variante tiene precio distinto
    weightGrams: { type: Number, min: 0 }, // peso en gramos
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
    subcategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    tags: [{ type: String, trim: true, lowercase: true }],

    // Clasificación de moda
    gender: { type: String, enum: ["female", "male", "unisex", "kids"], default: "unisex" },
    season: { type: String, enum: ["spring", "summer", "autumn", "winter", "all-year"], default: "all-year" },
    collection: { type: String, trim: true }, // ej. "SS26 Aurora"
    style: { type: String, trim: true }, // casual, formal, deportivo...

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 }, // precio antes de descuento
    costPrice: { type: Number, min: 0 }, // precio de coste (interno)
    currency: { type: String, default: "EUR" },
    taxRate: { type: Number, default: 21 }, // % IVA

    images: [{ type: String, trim: true }],
    coverImage: { type: String, trim: true },
    videoUrl: { type: String, trim: true }, // vídeo del producto
    sizeGuideUrl: { type: String, trim: true }, // guía de tallas

    variants: [variantSchema],
    stock: { type: Number, default: 0, min: 0 }, // stock total agregado
    materials: [{ type: String, trim: true }],
    composition: { type: String, trim: true }, // ej. "80% algodón, 20% poliéster"
    careInstructions: { type: String, trim: true },
    careSymbols: [{ type: String, trim: true }], // iconos de lavado/secado
    countryOfOrigin: { type: String, trim: true },
    weightGrams: { type: Number, min: 0 }, // peso medio para envío

    // Sostenibilidad (clave en moda actual)
    sustainabilityScore: { type: Number, min: 0, max: 100 }, // 0-100
    sustainabilityBadges: [{ type: String, trim: true }], // ej. "GOTS", "Fair Trade"
    isVegan: { type: Boolean, default: false },
    isHandmade: { type: Boolean, default: false },

    // Certificación blockchain
    certifiable: { type: Boolean, default: true },
    requiresCertificate: { type: Boolean, default: false }, // emisión obligatoria al vender

    // SEO
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    metaKeywords: [{ type: String, trim: true }],

    // Estado y ciclo de vida
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false }, // marca "nuevo" en la tienda
    isLimited: { type: Boolean, default: false }, // edición limitada
    publishedAt: { type: Date },
    launchDate: { type: Date },
    discontinuedAt: { type: Date },

    // Relacionados / recomendaciones
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],

    // Métricas
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
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
