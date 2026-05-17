// Script para crear/actualizar los dos admins del TFG
// Ejecutar con: node src/seeders/crear-admins.js

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Importar modelo Employee
const Employee = require("../models/Employee");

const admins = [
  {
    firstName: "Bohdan",
    lastName: "Kharuk",
    email: "bohdan@aurea.com",
    password: "Bohdan12345!",
    role: "admin",
    department: "Tecnología",
    jobTitle: "Frontend Developer",
  },
  {
    firstName: "Elena",
    lastName: "Arranz",
    email: "elena@aurea.com",
    password: "Elena12345!",
    role: "admin",
    department: "Tecnología",
    jobTitle: "Fullstack Developer",
  },
];

async function crearAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[Aurea] Conectado a MongoDB");

    for (const admin of admins) {
      const existe = await Employee.findOne({ email: admin.email });

      if (existe) {
        // Actualizar rol a admin si ya existe
        existe.role = "admin";
        existe.isActive = true;
        await existe.save();
        console.log(`✓ Actualizado: ${admin.email} → admin`);
      } else {
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(admin.password, salt);

        await Employee.create({
          ...admin,
          password: passwordHash,
          isActive: true,
          hireDate: new Date("2024-09-01"),
        });
        console.log(`✓ Creado: ${admin.email} (${admin.role}) — contraseña: ${admin.password}`);
      }
    }

    console.log("\n✅ Admins listos:");
    console.log("   bohdan@aurea.com / Bohdan12345!");
    console.log("   elena@aurea.com  / Elena12345!");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("[Aurea] MongoDB desconectado");
  }
}

crearAdmins();