import { stats, pedidos, productos } from "../data/mockData";

const estadoBadge = {
  enviado: "bg-blue-100 text-blue-700",
  procesando: "bg-amber-100 text-amber-700",
  entregado: "bg-green-100 text-green-700",
  pendiente: "bg-stone-100 text-stone-600",
  cancelado: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const recientes = pedidos.slice(0, 4);
  const sinStock = productos.filter((p) => p.stock === 0);
  const stockBajo = productos.filter((p) => p.stock > 0 && p.stock <= 8);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Dashboard</h2>
        <p className="text-stone-500 text-sm mt-1">Resumen del mes de abril 2025</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Ventas del mes", value: `${stats.ventasMes.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`, color: "text-amber-600" },
          { label: "Pedidos este mes", value: stats.pedidosMes, color: "text-stone-800" },
          { label: "Nuevos clientes", value: stats.clientesNuevos, color: "text-stone-800" },
          { label: "Sin stock", value: stats.productosSinStock, color: "text-red-600" },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-stone-400 text-xs uppercase tracking-wide">{m.label}</p>
            <p className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="col-span-2 bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Pedidos recientes</h3>
          <div className="space-y-3">
            {recientes.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-stone-800">{p.cliente}</p>
                  <p className="text-xs text-stone-400">{p.id} · {p.fecha}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[p.estado]}`}>
                    {p.estado}
                  </span>
                  <span className="text-sm font-semibold text-stone-700">
                    {p.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas stock */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Alertas de stock</h3>
          <div className="space-y-3">
            {sinStock.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.imagen} alt={p.nombre} className="w-8 h-8 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-700 truncate">{p.nombre}</p>
                  <span className="text-xs text-red-500 font-medium">Sin stock</span>
                </div>
              </div>
            ))}
            {stockBajo.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.imagen} alt={p.nombre} className="w-8 h-8 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-700 truncate">{p.nombre}</p>
                  <span className="text-xs text-amber-500 font-medium">{p.stock} unidades</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}