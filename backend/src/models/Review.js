/**
 * Modelo Review - Reseñas de productos hechas por clientes.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, trim: true, maxlength: 2000 },

    // Valoraciones específicas de moda
    sizeFeedback: { type: String, enum: ["small", "true_to_size", "large"], default: "true_to_size" },
    qualityRating: { type: Number, min: 1, max: 5 },
    valueRating: { type: Number, min: 1, max: 5 }, // relación calidad-precio

    // Multimedia
    images: [{ type: String, trim: true }],
    videoUrl: { type: String, trim: true },

    verifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },

    // Moderación
    reported: { type: Boolean, default: false },
    reportedReason: { type: String, trim: true },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "Employee" },
    moderatedAt: { type: Date },

    // Respuesta oficial de la marca
    reply: {
      message: { type: String, trim: true, maxlength: 1000 },
      author: { type: Schema.Types.ObjectId, ref: "Employee" },
      repliedAt: { type: Date },
    },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
