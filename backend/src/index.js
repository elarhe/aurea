/**
 * Aurea Backend - Punto de entrada
 * API REST con Express + JWT
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

// Middleware global
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "").split(",") }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: "ok", service: "aurea-backend", timestamp: new Date().toISOString() });
});

// TODO: montar routers reales en las próximas semanas
// app.use(`${API_PREFIX}/auth`, require("./routes/auth"));
// app.use(`${API_PREFIX}/products`, require("./routes/products"));
// app.use(`${API_PREFIX}/orders`, require("./routes/orders"));

// Arranque
app.listen(PORT, () => {
  console.log(`[Aurea] API escuchando en http://localhost:${PORT}${API_PREFIX}`);
});

module.exports = app;
