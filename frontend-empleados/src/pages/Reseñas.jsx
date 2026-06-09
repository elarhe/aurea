import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

const estadoBadge = {
  true: "bg-green-100 text-green-700",
  false: "bg-amber-100 text-amber-700",
};

function Estrellas({ rating }) {
  return (
    <span>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ color: s <= rating ? "#f59e0b" : "#e5e7eb" }}>★</span>
      ))}
    </span>
  );
}

export default function Reseñas() {
  const [reseñas, setReseñas] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pending"); // pending | approved | rejected | all
  const [seleccionada, setSeleccionada] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorBanner(null);
    try {
      const params = { page: 1, limit: 50 };
      if (filtro === "pending") params.approved = "false";
      else if (filtro === "approved") params.approved = "true";
      const res = await api.get("/reviews", { params });
      const data = res.data;
      setReseñas(data.reviews || data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErrorBanner(e.response?.data?.mensaje || "Error al cargar reseñas");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const aprobar = async (id) => {
    try {
      await api.patch(`/reviews/${id}/approve`);
      setReseñas((prev) => prev.map((r) => (r._id || r.id) === id ? { ...r, isApproved: true } : r));
      if (seleccionada && (seleccionada._id || seleccionada.id) === id) {
        setSeleccionada((prev) => ({ ...prev, isApproved: true }));
      }
    } catch (e) {
      setErrorBanner(e.response?.data?.mensaje || "Error al aprobar");
    }
  };

  const rechazar = async (id) => {
    try {
      await api.patch(`/reviews/${id}/reject`);
      setReseñas((prev) => prev.map((r) => (r._id || r.id) === id ? { ...r, isApproved: false } : r));
      if (seleccionada && (seleccionada._id || seleccionada.id) === id) {
        setSeleccionada((prev) => ({ ...prev, isApproved: false }));
      }
    } catch (e) {
      setErrorBanner(e.response?.data?.mensaje || "Error al rechazar");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar esta reseña? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReseñas((prev) => prev.filter((r) => (r._id || r.id) !== id));
      setTotal((t) => t - 1);
      if (seleccionada && (seleccionada._id || seleccionada.id) === id) setSeleccionada(null);
    } catch (e) {
      setErrorBanner(e.response?.data?.mensaje || "Error al eliminar");
    }
  };

  const enviarRespuesta = async () => {
    if (!respuesta.trim() || !seleccionada) return;
    setEnviando(true);
    try {
      const id = seleccionada._id || seleccionada.id;
      await api.patch(`/reviews/${id}/reply`, { message: respuesta });
      setSeleccionada((prev) => ({ ...prev, reply: { message: respuesta } }));
      setRespuesta("");
    } catch (e) {
      setErrorBanner(e.response?.data?.mensaje || "Error al responder");
    } finally {
      setEnviando(false);
    }
  };

  const getNombreCliente = (r) => {
    if (r.user?.firstName) return `${r.user.firstName} ${r.user.lastName || ""}`.trim();
    return r.user?.email || "Cliente";
  };

  const filtros = [
    { id: "pending", label: "Pendientes" },
    { id: "approved", label: "Aprobadas" },
    { id: "all", label: "Todas" },
  ];

  return (
    <div className="p-8 space-y-6">
      {errorBanner && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{errorBanner}</p>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Reseñas</h2>
          <p className="text-stone-500 text-sm mt-1">{total} reseñas en total</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filtro === f.id ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Tabla */}
        <div className="flex-1 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {["Cliente", "Producto", "Valoración", "Comentario", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                [1,2,3].map((i) => (
                  <tr key={i} className="border-b border-stone-100 animate-pulse">
                    {[1,2,3,4,5,6].map((j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : reseñas.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-stone-400 text-sm">No hay reseñas</td></tr>
              ) : reseñas.map((r) => {
                const id = r._id || r.id;
                const selId = seleccionada?._id || seleccionada?.id;
                return (
                  <tr
                    key={id}
                    onClick={() => { setSeleccionada(r); setRespuesta(""); }}
                    className={`border-b border-stone-100 cursor-pointer transition-colors hover:bg-stone-50 ${selId === id ? "bg-amber-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-stone-800 text-xs">{getNombreCliente(r)}</td>
                    <td className="px-4 py-3 text-stone-500 text-xs max-w-xs truncate">
                      {r.product?.name || r.productName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Estrellas rating={r.rating} />
                    </td>
                    <td className="px-4 py-3 text-stone-500 text-xs max-w-xs truncate">{r.comment || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[r.isApproved]}`}>
                        {r.isApproved ? "Aprobada" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {!r.isApproved && (
                          <button
                            onClick={(e) => { e.stopPropagation(); aprobar(id); }}
                            className="text-xs text-green-600 border border-green-200 px-2 py-0.5 rounded hover:bg-green-50 transition-colors"
                          >
                            Aprobar
                          </button>
                        )}
                        {r.isApproved && (
                          <button
                            onClick={(e) => { e.stopPropagation(); rechazar(id); }}
                            className="text-xs text-amber-600 border border-amber-200 px-2 py-0.5 rounded hover:bg-amber-50 transition-colors"
                          >
                            Rechazar
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminar(id); }}
                          className="text-xs text-red-600 border border-red-200 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detalle */}
        {seleccionada && (
          <div className="w-80 bg-white rounded-xl border border-stone-200 p-5 space-y-4 self-start sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">Detalle reseña</h3>
              <button onClick={() => setSeleccionada(null)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
            </div>

            <div className="space-y-2 text-sm">
              <div><p className="text-xs text-stone-400">Cliente</p><p className="font-medium text-stone-700">{getNombreCliente(seleccionada)}</p></div>
              <div><p className="text-xs text-stone-400">Producto</p><p className="text-stone-600">{seleccionada.product?.name || "—"}</p></div>
              <div>
                <p className="text-xs text-stone-400">Valoración</p>
                <div className="flex items-center gap-2">
                  <Estrellas rating={seleccionada.rating} />
                  <span className="text-stone-600 text-xs">{seleccionada.rating}/5</span>
                </div>
              </div>
              {seleccionada.title && <div><p className="text-xs text-stone-400">Título</p><p className="font-medium text-stone-700">{seleccionada.title}</p></div>}
              {seleccionada.comment && <div><p className="text-xs text-stone-400">Comentario</p><p className="text-stone-600 text-xs leading-relaxed">{seleccionada.comment}</p></div>}
              <div>
                <p className="text-xs text-stone-400">Estado</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[seleccionada.isApproved]}`}>
                  {seleccionada.isApproved ? "Aprobada" : "Pendiente"}
                </span>
              </div>
              {seleccionada.verifiedPurchase && (
                <p className="text-xs text-green-600 font-medium">✓ Compra verificada</p>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-2 border-t border-stone-100">
              {!seleccionada.isApproved ? (
                <button
                  onClick={() => aprobar(seleccionada._id || seleccionada.id)}
                  className="flex-1 text-xs bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  ✓ Aprobar
                </button>
              ) : (
                <button
                  onClick={() => rechazar(seleccionada._id || seleccionada.id)}
                  className="flex-1 text-xs bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Rechazar
                </button>
              )}
              <button
                onClick={() => eliminar(seleccionada._id || seleccionada.id)}
                className="flex-1 text-xs bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>

            {/* Responder */}
            <div className="pt-2 border-t border-stone-100">
              <p className="text-xs text-stone-400 mb-2">
                {seleccionada.reply?.message ? "Respuesta enviada:" : "Responder al cliente:"}
              </p>
              {seleccionada.reply?.message ? (
                <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-lg leading-relaxed">{seleccionada.reply.message}</p>
              ) : (
                <>
                  <textarea
                    rows={3}
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe una respuesta oficial..."
                    className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-400 resize-none"
                  />
                  <button
                    onClick={enviarRespuesta}
                    disabled={enviando || !respuesta.trim()}
                    className="w-full mt-2 text-xs bg-stone-900 text-white py-2 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {enviando ? "Enviando..." : "Enviar respuesta"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}