import { useState, useEffect, useCallback } from "react";
import { statsService } from "../services/api";

const estadoBadge = {
  enviado: "bg-blue-100 text-blue-700",
  procesando: "bg-amber-100 text-amber-700",
  entregado: "bg-green-100 text-green-700",
  pendiente: "bg-stone-100 text-stone-600",
  cancelado: "bg-red-100 text-red-700",
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
      <div className="h-3 bg-stone-100 rounded w-24 mb-3"></div>
      <div className="h-8 bg-stone-100 rounded w-20"></div>
    </div>
  );
}

function TrendArrow({ pct }) {
  if (pct === null || pct === undefined) return null;
  const positive = pct >= 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${positive ? "text-green-600" : "text-red-500"}`}>
      {positive ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function BarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.revenue || 0), 1);
  return (
    <div className="flex items-end gap-2 h-28 mt-3">
      {data.map((d, i) => {
        const heightPct = Math.round(((d.revenue || 0) / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full bg-amber-400 rounded-t transition-all group-hover:bg-amber-500"
              style={{ height: `${Math.max(heightPct, 2)}%` }}
            ></div>
            <span className="text-stone-400 text-xs">{d.label || d.month || ""}</span>
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
              {(d.revenue || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await statsService.getDashboard();
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Error al cargar el dashboard");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-red-700 font-medium text-sm">No se pudo cargar el dashboard</p>
            <p className="text-red-500 text-xs mt-1">{error}</p>
          </div>
          <button onClick={cargar} className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const metricas = data ? [
    {
      label: "Ventas del mes",
      value: (data.ventasMes ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" }),
      color: "text-amber-600",
      pct: data.ventasMesPct ?? null,
    },
    {
      label: "Pedidos este mes",
      value: data.pedidosMes ?? 0,
      color: "text-stone-800",
      pct: data.pedidosMesPct ?? null,
    },
    {
      label: "Clientes nuevos",
      value: data.clientesNuevos ?? 0,
      color: "text-stone-800",
      pct: data.clientesNuevosPct ?? null,
    },
    {
      label: "Certificados emitidos",
      value: data.certificadosEmitidos ?? 0,
      color: "text-stone-800",
      pct: data.certificadosEmitidosPct ?? null,
    },
  ] : [];

  const pedidosRecientes = data?.pedidosRecientes?.slice(0, 5) || [];
  const alertasStock = [
    ...(data?.sinStock || []).map((p) => ({ ...p, nivel: "sin-stock" })),
    ...(data?.stockBajo || []).map((p) => ({ ...p, nivel: "bajo" })),
  ];
  const revenueChart = data?.revenueUltimos6Meses || [];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Dashboard</h2>
        <p className="text-stone-500 text-sm mt-1">
          {data ? `Resumen del mes · actualizado ahora` : "Cargando datos..."}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4">
        {cargando
          ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
          : metricas.map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-stone-200 p-5">
                <p className="text-stone-400 text-xs uppercase tracking-wide">{m.label}</p>
                <p className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                <TrendArrow pct={m.pct} />
              </div>
            ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Pedidos recientes */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Pedidos recientes</h3>
            {cargando ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-stone-100">
                    <div className="space-y-1.5">
                      <div className="h-3 bg-stone-100 rounded w-32"></div>
                      <div className="h-2.5 bg-stone-100 rounded w-24"></div>
                    </div>
                    <div className="h-3 bg-stone-100 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : pedidosRecientes.length === 0 ? (
              <p className="text-stone-400 text-sm py-4 text-center">No hay pedidos recientes</p>
            ) : (
              <div className="space-y-3">
                {pedidosRecientes.map((p) => (
                  <div key={p._id || p.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{p.cliente?.nombre || p.cliente || "—"}</p>
                      <p className="text-xs text-stone-400">
                        {p.orderNumber || p._id?.slice(-6) || "—"} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES") : p.fecha}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[p.status] || estadoBadge[p.estado] || "bg-stone-100 text-stone-600"}`}>
                        {p.status || p.estado}
                      </span>
                      <span className="text-sm font-semibold text-stone-700">
                        {(p.total || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="text-sm font-semibold text-stone-700 mb-1">Ingresos últimos 6 meses</h3>
            {cargando ? (
              <div className="flex items-end gap-2 h-28 mt-3 animate-pulse">
                {[40, 60, 35, 80, 55, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-stone-100 rounded-t" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            ) : revenueChart.length === 0 ? (
              <p className="text-stone-400 text-sm py-4 text-center">Sin datos de ingresos</p>
            ) : (
              <BarChart data={revenueChart} />
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-6">
          {/* Alertas stock */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Alertas de stock</h3>
            {cargando ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-stone-100"></div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-stone-100 rounded w-28"></div>
                      <div className="h-2.5 bg-stone-100 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : alertasStock.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-4">Todo el stock en orden</p>
            ) : (
              <div className="space-y-3">
                {alertasStock.map((p) => (
                  <div key={p._id || p.id} className="flex items-center gap-3">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre || p.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-stone-100 flex items-center justify-center text-xs text-stone-400 flex-shrink-0">
                        {(p.nombre || p.name || "?")[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-700 truncate">{p.nombre || p.name}</p>
                      {p.nivel === "sin-stock" ? (
                        <span className="text-xs text-red-500 font-medium">Sin stock</span>
                      ) : (
                        <span className="text-xs text-amber-500 font-medium">{p.stock} unidades</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificados blockchain mini-stat */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🛡</span>
              <h3 className="text-sm font-semibold text-stone-700">Certificados blockchain</h3>
            </div>
            {cargando ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-stone-100 rounded w-20"></div>
                <div className="h-3 bg-stone-100 rounded w-32"></div>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-stone-800">{data?.certificadosEmitidos ?? 0}</p>
                <p className="text-xs text-stone-400 mt-1">certificados emitidos en total</p>
                {(data?.certificadosPendientes ?? 0) > 0 && (
                  <p className="text-xs text-amber-500 font-medium mt-2">
                    {data.certificadosPendientes} pendientes de emitir
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
