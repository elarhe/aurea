import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const generoLabel = { male: "Hombre", female: "Mujer", unisex: "No binario", unspecified: "—" };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const LIMITE = 20;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { page: pagina, limit: LIMITE };
      const res = await api.get("/users", { params });
      const data = res.data;
      setClientes(data.usuarios || data.users || data.data || []);
      setTotal(data.total || data.count || 0);
    } catch (e) {
      setError(e.response?.data?.mensaje || "Error al cargar clientes");
    } finally {
      setCargando(false);
    }
  }, [pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(q) ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const totalPaginas = Math.ceil(total / LIMITE);

  const initials = (c) => {
    const n = `${c.firstName || ""} ${c.lastName || ""}`.trim();
    return n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?";
  };

  const toggleEstado = async (id, activo) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !activo });
      setClientes((prev) => prev.map((c) => (c._id || c.id) === id ? { ...c, isActive: !activo } : c));
      if (seleccionado && (seleccionado._id || seleccionado.id) === id) {
        setSeleccionado((prev) => ({ ...prev, isActive: !activo }));
      }
    } catch {
      alert("Error al cambiar estado");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Clientes</h2>
          <p className="text-stone-500 text-sm mt-1">{total} clientes registrados</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-stone-400 w-72"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={cargar} className="text-xs text-red-700 font-medium hover:underline">Reintentar</button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Tabla */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {["Cliente", "Email", "Género", "Puntos", "Estado", "Alta", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                [1,2,3,4,5].map((i) => (
                  <tr key={i} className="border-b border-stone-100 animate-pulse">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-stone-100 rounded-full"/><div className="h-3 bg-stone-100 rounded w-28"/></div></td>
                    <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-36"/></td>
                    <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-16"/></td>
                    <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-10"/></td>
                    <td className="px-4 py-3"><div className="h-4 bg-stone-100 rounded-full w-16"/></td>
                    <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-20"/></td>
                    <td></td>
                  </tr>
                ))
              ) : clientesFiltrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-stone-400 text-sm">No se encontraron clientes</td></tr>
              ) : clientesFiltrados.map((c) => {
                const id = c._id || c.id;
                const nombre = c.fullName || `${c.firstName || ""} ${c.lastName || ""}`.trim();
                const selId = seleccionado?._id || seleccionado?.id;
                return (
                  <tr
                    key={id}
                    onClick={() => setSeleccionado(c)}
                    className={`border-b border-stone-100 cursor-pointer transition-colors hover:bg-stone-50 ${selId === id ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-xs font-bold flex-shrink-0">
                          {initials(c)}
                        </div>
                        <p className="font-medium text-stone-800">{nombre || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{c.email}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs">{generoLabel[c.gender] || "—"}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs font-medium">{c.loyaltyPoints ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {c.isActive ? "activo" : "inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-ES") : "—"}
                    </td>
                    <td className="px-4 py-3 text-stone-400 text-xs">›</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detalle */}
        {seleccionado && (
          <div className="w-72 bg-white rounded-xl border border-stone-200 p-5 space-y-4 self-start sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Detalle cliente</h3>
              <button onClick={() => setSeleccionado(null)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold">
                {initials(seleccionado)}
              </div>
              <div>
                <p className="font-semibold text-stone-800">{seleccionado.fullName || `${seleccionado.firstName} ${seleccionado.lastName}`}</p>
                <p className="text-xs text-stone-400">{seleccionado.email}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-stone-100 pt-3">
              <div><p className="text-xs text-stone-400">Género</p><p className="text-stone-700">{generoLabel[seleccionado.gender] || "—"}</p></div>
              <div><p className="text-xs text-stone-400">Idioma</p><p className="text-stone-700">{seleccionado.preferredLanguage?.toUpperCase() || "—"}</p></div>
              <div><p className="text-xs text-stone-400">Puntos fidelidad</p><p className="text-stone-700 font-semibold">{seleccionado.loyaltyPoints ?? 0}</p></div>
              <div><p className="text-xs text-stone-400">Pedidos</p><p className="text-stone-700">{seleccionado.loginCount ?? 0} sesiones</p></div>
              <div><p className="text-xs text-stone-400">Email verificado</p><p className="text-stone-700">{seleccionado.emailVerified ? "Sí" : "No"}</p></div>
              <div><p className="text-xs text-stone-400">Newsletter</p><p className="text-stone-700">{seleccionado.newsletter ? "Sí" : "No"}</p></div>
              <div>
                <p className="text-xs text-stone-400">Alta</p>
                <p className="text-stone-700">{seleccionado.createdAt ? new Date(seleccionado.createdAt).toLocaleDateString("es-ES") : "—"}</p>
              </div>
            </div>
            <button
              onClick={() => toggleEstado(seleccionado._id || seleccionado.id, seleccionado.isActive)}
              className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all
                ${seleccionado.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
            >
              {seleccionado.isActive ? "Desactivar cuenta" : "Activar cuenta"}
            </button>
            <button
            onClick={async () => {
                if (!confirm(`¿Eliminar a ${seleccionado.fullName || seleccionado.email}? Esta acción no se puede deshacer.`)) return;
                try {
                await api.delete(`/users/${seleccionado._id || seleccionado.id}`);
                setClientes((prev) => prev.filter((c) => (c._id || c.id) !== (seleccionado._id || seleccionado.id)));
                setTotal((t) => t - 1);
                setSeleccionado(null);
                } catch {
                alert("Error al eliminar el cliente");
                }
            }}
            className="w-full text-xs px-3 py-2 rounded-lg font-medium transition-all bg-red-600 text-white hover:bg-red-700"
            >
            Eliminar cliente
            </button>
          </div>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-stone-400">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors">← Anterior</button>
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors">Siguiente →</button>
          </div>
        </div>
      )}
    </div>
  );
}