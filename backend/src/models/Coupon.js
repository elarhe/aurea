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

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
