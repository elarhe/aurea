/**
 * Modelo Coupon - Cupones de descuento aplicables al checkout.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },

    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true, min: 0 },

    minPurchase: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },

    usageLimit: { type: Number, default: null }, // null = ilimitado
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },

    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },

    appliesTo: {
      categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    },
    excludedCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],

    // Restricciones
    firstOrderOnly: { type: Boolean, default: false },
    freeShipping: { type: Boolean, default: false }, // bonifica el envío
    stackable: { type: Boolean, default: false }, // combinable con otros cupones
    usedByUsers: [{ type: Schema.Types.ObjectId, ref: "User" }], // historial

    // Afiliados / influencers (clave para marketing)
    affiliate: {
      isAffiliate: { type: Boolean, default: false },
      name: { type: String, trim: true },
      commissionPercent: { type: Number, min: 0, max: 100 },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
