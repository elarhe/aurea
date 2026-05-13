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
    revokedAt: { type: Date },
    revocationReason: { type: String, trim: true },
    error: { type: String },

    // Verificación pública
    publicSlug: { type: String, trim: true, unique: true, sparse: true, index: true }, // URL corta
    qrCodeUrl: { type: String, trim: true }, // PNG con QR para incluir en la etiqueta
    verificationCount: { type: Number, default: 0 },
    lastVerifiedAt: { type: Date },

    // Datos técnicos de la transacción
    gasUsed: { type: Number },
    gasPriceWei: { type: String, trim: true }, // como string para evitar precisión
    transactionFeeEth: { type: Number },

    // Transferencia de propiedad (cuando un cliente revende su prenda)
    transferHistory: [
      {
        from: { type: String, trim: true },
        to: { type: String, trim: true },
        transactionHash: { type: String, trim: true },
        transferredAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
