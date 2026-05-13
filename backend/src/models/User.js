/**
 * Modelo User - Clientes registrados de la tienda Aurea.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email no válido"],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: { type: String, trim: true },
    birthDate: { type: Date },
    gender: { type: String, enum: ["female", "male", "other", "unspecified"], default: "unspecified" },
    avatar: { type: String, trim: true }, // URL del avatar
    dni: { type: String, trim: true, uppercase: true }, // DNI/NIE para facturas
    preferredLanguage: { type: String, enum: ["es", "en", "ca"], default: "es" },
    preferredCurrency: { type: String, default: "EUR" },

    addresses: [{ type: Schema.Types.ObjectId, ref: "Address" }],
    defaultAddress: { type: Schema.Types.ObjectId, ref: "Address" },

    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    walletAddress: { type: String, trim: true }, // dirección Ethereum opcional

    // Marketing / fidelización
    newsletter: { type: Boolean, default: false },
    marketingConsent: { type: Boolean, default: false }, // RGPD
    marketingConsentDate: { type: Date },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, trim: true, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },

    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash de la contraseña antes de guardar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
