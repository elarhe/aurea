import { useState } from "react";
import { pedidos as pedidosIniciales } from "../data/mockData";

const estadoOpciones = ["pendiente", "procesando", "enviado", "entregado", "cancelado"];

const estadoBadge = {
  enviado: "bg-blue-100 text-blue-700",
  procesando: "bg-amber-100 text-amber-700",
  entregado: "bg-green-100 text-green-700",
  pendiente: "bg-stone-100 text-stone-600",
  cancelado: "bg-red-100 text-red-700",
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtro, setFiltro] = useState("todos");
  const [seleccionado, setSeleccionado] = useState(null);

  const pedidosFiltrados = filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  const cambiarEstado = (id, nuevoEstado) => {
    setPedidos((prev) => prev.map((p) => p.id === id ? { ...p, estado: nuevoEstado } : p));
    if (seleccionado?.id === id) setSeleccionado((prev) => ({ ...prev, estado: nuevoEstado }));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Pedidos</h2>
          <p className="text-stone-500 text-sm mt-1">{pedidos.length} pedidos en total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {["todos", ...estadoOpciones].map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
              ${filtro === f ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Tabla */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {["Pedido", "Cliente", "Fecha", "Total", "Estado", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSeleccionado(p)}
                  className={`border-b border-stone-100 cursor-pointer transition-colors hover:bg-stone-50
                    ${seleccionado?.id === p.id ? "bg-amber-50" : ""}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{p.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{p.cliente}</p>
                    <p className="text-xs text-stone-400">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-500">{p.fecha}</td>
                  <td className="px-4 py-3 font-semibold text-stone-700">
                    {p.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[p.estado]}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400 text-xs">›</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detalle */}
        {seleccionado && (
          <div className="w-72 bg-white rounded-xl border border-stone-200 p-5 space-y-4 self-start">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">{seleccionado.id}</h3>
              <button onClick={() => setSeleccionado(null)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><p className="text-stone-400 text-xs">Cliente</p><p className="font-medium text-stone-700">{seleccionado.cliente}</p></div>
              <div><p className="text-stone-400 text-xs">Email</p><p className="text-stone-600">{seleccionado.email}</p></div>
              <div><p className="text-stone-400 text-xs">Fecha</p><p className="text-stone-600">{seleccionado.fecha}</p></div>
              <div><p className="text-stone-400 text-xs">Total</p><p className="font-bold text-stone-800">{seleccionado.total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</p></div>
              <div>
                <p className="text-stone-400 text-xs mb-1">Productos</p>
                {seleccionado.productos.map((pr, i) => (
                  <p key={i} className="text-stone-600 text-xs">· {pr}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-stone-400 text-xs mb-2">Cambiar estado</p>
              <div className="flex flex-wrap gap-1.5">
                {estadoOpciones.map((e) => (
                  <button
                    key={e}
                    onClick={() => cambiarEstado(seleccionado.id, e)}
                    className={`text-xs px-2 py-1 rounded-md capitalize transition-all
                      ${seleccionado.estado === e
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}