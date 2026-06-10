import { useState, useEffect, useCallback } from "react";
import { statsService } from "../services/api";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const estadoBadge = {
  paid: "bg-green-100 text-green-700",
  processing: "bg-amber-100 text-amber-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  pending: "bg-stone-100 text-stone-600",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const estadoLabel = {
  paid: "Pagado", processing: "Procesando", shipped: "Enviado",
  delivered: "Entregado", pending: "Pendiente", cancelled: "Cancelado", refunded: "Reembolsado",
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
      <div className="h-3 bg-stone-100 rounded w-24 mb-3" />
      <div className="h-8 bg-stone-100 rounded w-20" />
    </div>
  );
}

function TrendArrow({ actual, anterior }) {
  if (!anterior || anterior === 0) return null;
  const pct = ((actual - anterior) / anterior) * 100;
  const positive = pct >= 0;
  return (
    <span className={`text-xs font-medium flex items-center gap-0.5 mt-1 ${positive ? "text-green-600" : "text-red-500"}`}>
      {positive ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}% vs mes anterior
    </span>
  );
}

function RevenueChart({ data }) {
  if (!data || data.length === 0) return <p className="text-stone-400 text-sm py-8 text-center">Sin datos de ingresos</p>;

  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const labels = data.map((d) => d.mes || (d.mesNum ? meses[d.mesNum - 1] : ""));
  const ingresos = data.map((d) => d.total || 0);
  const pedidos = data.map((d) => d.pedidos || 0);

  const lineData = {
    labels,
    datasets: [
      {
        label: "Ingresos (€)",
        data: ingresos,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#f59e0b",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Pedidos",
        data: pedidos,
        borderColor: "#78716c",
        backgroundColor: "rgba(120,113,108,0.0)",
        borderWidth: 2,
        borderDash: [4, 4],
        pointBackgroundColor: "#78716c",
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, 
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 11 }, color: "#78716c", boxWidth: 20 },
      },
      tooltip: {
        backgroundColor: "#1c1c1c",
        titleColor: "#fff",
        bodyColor: "#d6d3d1",
        padding: 10,
        callbacks: {
          label: (ctx) => {
            if (ctx.datasetIndex === 0)
              return ` ${ctx.raw.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}`;
            return ` ${ctx.raw} pedidos`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#a8a29e", font: { size: 11 } } },
      y: {
        position: "left",
        grid: { color: "#f5f5f4" },
        ticks: {
          color: "#a8a29e", font: { size: 11 },
          callback: (v) => v.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
        },
      },
      y1: {
        position: "right",
        grid: { display: false },
        ticks: { color: "#a8a29e", font: { size: 11 } },
      },
    },
  };

  return <Line data={lineData} options={options} />;
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
      setData(res.data.data || res.data);
    } catch (e) {
      setError(e.response?.data?.mensaje || "Error al cargar el dashboard");
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

  const ventasActual = data?.ventasMesActual?.total ?? 0;
  const ventasAnterior = data?.ventasMesAnterior?.total ?? 0;
  const pedidosActual = data?.ventasMesActual?.pedidos ?? 0;
  const pedidosAnterior = data?.ventasMesAnterior?.pedidos ?? 0;
  const clientesNuevos = data?.clientesNuevosMes ?? 0;
  const certificados = data?.totalCertificados ?? 0;
  const sinStock = data?.sinStock ?? 0;
  const stockBajo = data?.stockBajo ?? 0;

  const metricas = [
    {
      label: "Ventas del mes",
      value: ventasActual.toLocaleString("es-ES", { style: "currency", currency: "EUR" }),
      color: "text-amber-600",
      trend: <TrendArrow actual={ventasActual} anterior={ventasAnterior} />,
    },
    {
      label: "Pedidos este mes",
      value: pedidosActual,
      color: "text-stone-800",
      trend: <TrendArrow actual={pedidosActual} anterior={pedidosAnterior} />,
    },
    {
      label: "Clientes nuevos",
      value: clientesNuevos,
      color: "text-stone-800",
      trend: null,
    },
    {
      label: "Certificados emitidos",
      value: certificados,
      color: "text-stone-800",
      trend: null,
    },
  ];

  const pedidosRecientes = data?.ultimosPedidos?.slice(0, 5) || [];
  const revenueChart = data?.revenue6Meses || [];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Dashboard</h2>
        <p className="text-stone-500 text-sm mt-1">
          {data ? "Resumen del mes · actualizado ahora" : "Cargando datos..."}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4">
        {cargando
          ? [1,2,3,4].map((i) => <SkeletonCard key={i} />)
          : metricas.map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-stone-200 p-5">
                <p className="text-stone-400 text-xs uppercase tracking-wide">{m.label}</p>
                <p className={`text-3xl font-bold mt-1 ${m.color}`}>{m.value}</p>
                {m.trend}
              </div>
            ))}
      </div>

      {/* Gráfico ingresos */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-700">Ingresos y pedidos — últimos 6 meses</h3>
            <p className="text-xs text-stone-400 mt-0.5">Línea sólida: ingresos · Línea punteada: pedidos</p>
          </div>
          <span className="text-xs text-stone-400 bg-stone-50 px-3 py-1 rounded-full border border-stone-200">
            Total: {revenueChart.reduce((a, d) => a + (d.total || 0), 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </span>
        </div>
        {cargando ? (
          <div className="h-48 flex items-end gap-2 animate-pulse">
            {[40,60,35,80,55,70].map((h, i) => (
              <div key={i} className="flex-1 bg-stone-100 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : (
          <div style={{ height: "200px", position: "relative" }}>
            <RevenueChart data={revenueChart} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {/* Pedidos recientes */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Pedidos recientes</h3>
            {cargando ? (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-stone-100">
                    <div className="space-y-1.5">
                      <div className="h-3 bg-stone-100 rounded w-32" />
                      <div className="h-2.5 bg-stone-100 rounded w-24" />
                    </div>
                    <div className="h-3 bg-stone-100 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : pedidosRecientes.length === 0 ? (
              <p className="text-stone-400 text-sm py-4 text-center">No hay pedidos recientes</p>
            ) : (
              <div className="space-y-3">
                {pedidosRecientes.map((p) => {
                  const cliente = p.user?.firstName
                    ? `${p.user.firstName} ${p.user.lastName || ""}`.trim()
                    : p.user?.email || "—";
                  return (
                    <div key={p._id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-stone-800">{cliente}</p>
                        <p className="text-xs text-stone-400">
                          {p.orderNumber || p._id?.slice(-6)} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES") : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[p.status] || "bg-stone-100 text-stone-600"}`}>
                          {estadoLabel[p.status] || p.status}
                        </span>
                        <span className="text-sm font-semibold text-stone-700">
                          {(p.total || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {[1,2,3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-stone-100" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-stone-100 rounded w-28" />
                      <div className="h-2.5 bg-stone-100 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sinStock === 0 && stockBajo === 0 ? (
              <p className="text-stone-400 text-sm text-center py-4">Todo el stock en orden ✓</p>
            ) : (
              <div className="space-y-3">
                {sinStock > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 font-bold text-base flex-shrink-0">{sinStock}</div>
                    <div>
                      <p className="text-xs font-semibold text-stone-700">Sin stock</p>
                      <p className="text-xs text-red-500">Requieren reposición</p>
                    </div>
                  </div>
                )}
                {stockBajo > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 font-bold text-base flex-shrink-0">{stockBajo}</div>
                    <div>
                      <p className="text-xs font-semibold text-stone-700">Stock bajo</p>
                      <p className="text-xs text-amber-500">Menos de 3 unidades</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Certificados */}
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🛡</span>
              <h3 className="text-sm font-semibold text-stone-700">Certificados blockchain</h3>
            </div>
            {cargando ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-stone-100 rounded w-20" />
                <div className="h-3 bg-stone-100 rounded w-32" />
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-stone-800">{certificados}</p>
                <p className="text-xs text-stone-400 mt-1">certificados emitidos en total</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}