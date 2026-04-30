/**
 * Modelo Certificate - Certificado de autenticidad emitido en la blockchain.
 * Funciona como puente entre la base de datos y el smart contract AureaCert.sol.
 */
const mongoose = require("mongoose");
const { Schema } = mongoose;

const certificateSchema = new Schema(
  {
    // Identificadores
    certificateId: { type: Number, required: true, unique: true, index: true }, // id devuelto por el contrato
    serialNumber: { type: String, required: true, unique: true, trim: true, index: true },

    // Relaciones
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Metadatos del producto certificado
    productSnapshot: {
      brand: String,
      materials: [String],
      countryOfOrigin: String,
      images: [String],
    },

    // Datos on-chain
    network: { type: String, default: "sepolia" },
    contractAddress: { type: String, required: true },
    transactionHash: { type: String, required: true, index: true },
    blockNumber: { type: Number },
    issuerAddress: { type: String, required: true },
    ownerAddress: { type: String, required: true }, // wallet o hash representativo
    metadataURI: { type: String, trim: true }, // ipfs://...

    // Estado
    status: {
      type: String,
      enum: ["pending", "issued", "failed", "revoked"],
      default: "pending",
    },
    issuedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
