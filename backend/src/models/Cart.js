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
    items: [cartItemSchema],
    subtotal: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },
  },
  { timestamps: true }
);

cartSchema.methods.recalculate = function () {
  this.subtotal = this.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  return this.subtotal;
};

module.exports = mongoose.model("Cart", cartSchema);
