/**
 * Modelo Employee - Personal interno de Aurea (panel backoffice).
 * Roles: admin, manager, staff.
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email no válido"],
    },
    password: { type: String, required: true, minlength: 8, select: false },

    role: {
      type: String,
      enum: ["admin", "manager", "staff"],
      default: "staff",
      required: true,
    },
    permissions: [{ type: String }], // permisos granulares opcionales
    department: { type: String, trim: true },

    // Datos laborales
    phone: { type: String, trim: true },
    dni: { type: String, trim: true, uppercase: true },
    avatar: { type: String, trim: true },
    hireDate: { type: Date, default: Date.now },
    jobTitle: { type: String, trim: true }, // ej. "Responsable de almacén"
    notes: { type: String, trim: true }, // notas internas de RRHH

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

employeeSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Employee", employeeSchema);
