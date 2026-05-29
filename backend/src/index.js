require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { connectDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 4000;
const API_PREFIX = process.env.API_PREFIX || "/api/v1";

// Middleware global
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "").split(",") }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Rutas
const authRoutes = require("./routes/auth.routes");
const certificateRoutes = require("./routes/certificate.routes");
const productRoutes = require("./routes/products.routes");
const categoryRoutes = require("./routes/categories.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/orders.routes");
const reviewRoutes = require("./routes/reviews.routes");
const userRoutes = require("./routes/users.routes");
const employeeRoutes = require("./routes/employees.routes");
const statsRoutes = require("./routes/stats.routes");
const couponRoutes = require("./routes/coupons.routes");

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/certificates`, certificateRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/stats`, statsRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);

// Health check
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: "ok", service: "aurea-backend", timestamp: new Date().toISOString() });
});

// Arranque
async function start() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`[Aurea] API escuchando en http://localhost:${PORT}${API_PREFIX}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;