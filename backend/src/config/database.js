/**
 * Conexión a la base de datos MongoDB con Mongoose.
 * Se conecta usando la URI definida en MONGO_URI (.env).
 */
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

async function connectDatabase() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI no está definido en el archivo .env");
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || "aurea",
      autoIndex: process.env.NODE_ENV !== "production",
    });
    console.log(`[Aurea] Conectado a MongoDB (${mongoose.connection.name})`);
  } catch (error) {
    console.error("[Aurea] Error de conexión a MongoDB:", error.message);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("[Aurea] MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[Aurea] MongoDB desconectado");
  });
}

async function disconnectDatabase() {
  await mongoose.connection.close();
}

module.exports = { connectDatabase, disconnectDatabase, mongoose };
