/**
 * Modelo Order - Pedidos realizados por los clientes.
 * Incluye snapshots inmutables de productos, dirección y precios al momento de la compra.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true }, // snapshot
    sku: { type: String, required: true },
    variant: {
      size: String,
      color: String,
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String, trim: true },

    // Certificado blockchain asociado a este item (1 por unidad puede ser desbordante,
    // así que se asocia 1 certificado por línea de pedido)
    certificate: { type: Schema.Types.ObjectId, ref: "Certificate", default: null },
  },
  { _id: true }
);

const shippingAddressSnapshot = new Schema(
  {
    recipient: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items: [orderItemSchema],

    shippingAddress: shippingAddressSnapshot,
    billingAddress: shippingAddressSnapshot,

    // Importes
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EUR" },
    couponCode: { type: String, trim: true },

    // Estado del pedido
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },

    // Pago
    payment: {
      provider: { type: String, enum: ["stripe", "paypal", "manual"], default: "stripe" },
      status: {
        type: String,
        enum: ["pending", "succeeded", "failed", "refunded"],
        default: "pending",
      },
      transactionId: { type: String, trim: true },
      paidAt: { type: Date },
    },

    // Envío
    shipping: {
      carrier: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date,
    },

    // Auditoría / blockchain
    notes: { type: String, trim: true },
    employeeAssigned: { type: Schema.Types.ObjectId, ref: "Employee" },
    certificatesIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
