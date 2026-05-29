const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Certificate = require("../models/Certificate");

// GET /dashboard — métricas globales para el panel admin
const dashboard = async (req, res) => {
  try {
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);

    const statusPagados = ["paid", "processing", "shipped", "delivered"];

    // Ventas mes actual y mes anterior
    const [ventasMesActual, ventasMesAnterior] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: statusPagados }, createdAt: { $gte: inicioMesActual } } },
        { $group: { _id: null, total: { $sum: "$total" }, pedidos: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: statusPagados }, createdAt: { $gte: inicioMesAnterior, $lte: finMesAnterior } } },
        { $group: { _id: null, total: { $sum: "$total" }, pedidos: { $sum: 1 } } },
      ]),
    ]);

    // Clientes nuevos del mes
    const clientesNuevosMes = await User.countDocuments({ createdAt: { $gte: inicioMesActual } });

    // Productos sin stock y con stock bajo
    const [sinStock, stockBajo] = await Promise.all([
      Product.countDocuments({ isActive: true, stock: 0 }),
      Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 3 } }),
    ]);

    // Total de certificados emitidos
    const totalCertificados = await Certificate.countDocuments({ status: "issued" });

    // Últimos 5 pedidos
    const ultimosPedidos = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "firstName lastName email")
      .lean();

    // Top 5 productos más vendidos
    const topProductos = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(5)
      .select("name slug coverImage soldCount price rating")
      .lean();

    // Revenue de los últimos 6 meses
    const revenue6Meses = [];
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 0, 23, 59, 59);
      const result = await Order.aggregate([
        { $match: { status: { $in: statusPagados }, createdAt: { $gte: inicio, $lte: fin } } },
        { $group: { _id: null, total: { $sum: "$total" }, pedidos: { $sum: 1 } } },
      ]);
      revenue6Meses.push({
        mes: inicio.toLocaleString("es-ES", { month: "short", year: "numeric" }),
        año: inicio.getFullYear(),
        mesNum: inicio.getMonth() + 1,
        total: result[0]?.total || 0,
        pedidos: result[0]?.pedidos || 0,
      });
    }

    return res.json({
      ok: true,
      data: {
        ventasMesActual: {
          total: ventasMesActual[0]?.total || 0,
          pedidos: ventasMesActual[0]?.pedidos || 0,
        },
        ventasMesAnterior: {
          total: ventasMesAnterior[0]?.total || 0,
          pedidos: ventasMesAnterior[0]?.pedidos || 0,
        },
        clientesNuevosMes,
        sinStock,
        stockBajo,
        totalCertificados,
        ultimosPedidos,
        topProductos,
        revenue6Meses,
      },
    });
  } catch (error) {
    console.error("[stats.dashboard]", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

module.exports = { dashboard };
