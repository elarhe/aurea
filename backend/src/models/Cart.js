/**
 * Modelo Cart - Carrito de compra (uno por usuario).
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot del precio
  },
  { _id: true, timestamps: true }
);

const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    guestSessionId: { type: String, trim: true, sparse: true, index: true }, // carrito de invitado
    items: [cartItemSchema],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    estimatedShipping: { type: Number, default: 0, min: 0 },
    estimatedTax: { type: Number, default: 0, min: 0 },
    estimatedTotal: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "EUR" },
    expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }, // TTL automático
  },
  { timestamps: true }
);

cartSchema.methods.recalculate = function () {
  this.subtotal = this.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  return this.subtotal;
};

module.exports = mongoose.model("Cart", cartSchema);
