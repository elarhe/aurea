/**
 * Modelo Address - Direcciones de envío y facturación.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, trim: true }, // ej. "Casa", "Trabajo"
    recipient: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true }, // provincia
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "España" },
    countryCode: { type: String, trim: true, uppercase: true, default: "ES" }, // ISO-3166-1 alpha-2

    type: { type: String, enum: ["shipping", "billing", "both"], default: "both" },
    deliveryInstructions: { type: String, trim: true, maxlength: 500 },

    // Coordenadas opcionales (para mapa de envíos)
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
    },

    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
