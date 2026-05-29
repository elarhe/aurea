import { useState, useEffect, useCallback } from "react";
import { pedidosService, certificadosService } from "../services/api";

const estadoOpciones = ["pendiente", "procesando", "enviado", "entregado", "cancelado"];

const estadoBadge = {
  enviado: "bg-blue-100 text-blue-700",
  procesando: "bg-amber-100 text-amber-700",
  entregado: "bg-green-100 text-green-700",
  pendiente: "bg-stone-100 text-stone-600",
  cancelado: "bg-red-100 text-red-700",
};

const certBadge = {
  issued: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-600",
  revoked: "bg-stone-100 text-stone-500",
};

function truncHash(hash) {
  if (!hash) return "—";
  return hash.slice(0, 8) + "..." + hash.slice(-6);
}

function EtherscanLink({ txHash }) {
  if (!txHash) return null;
  return (
    <a
      href={`https://sepolia.etherscan.io/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline font-mono text-xs"
    >
      {truncHash(txHash)}
    </a>
  );
}

function PanelCertificados({ pedido }) {
  const [emitiendo, setEmitiendo] = useState({});
  const [resultado, setResultado] = useState({});
  const [error, setError] = useState({});

  if (!pedido) return null;

  const items = pedido.items || pedido.productos || [];

  const emitir = async (orderId, itemId) => {
    setEmitiendo((prev) => ({ ...prev, [itemId]: true }));
    setError((prev) => ({ ...prev, [itemId]: null }));
    try {
      const res = await certificadosService.emitir(orderId, itemId);
      setResultado((prev) => ({ ...prev, [itemId]: res.data }));
    } catch (e) {
      setError((prev) => ({ ...prev, [itemId]: e.response?.data?.message || "Error al emitir" }));
    } finally {
      setEmitiendo((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const conCertificado = items.filter((item) => item.certificate || item.certificado);
  const sinCertificado = items.filter(
    (item) => item.certifiable && !item.certificate && !item.certificado && !resultado[item._id || item.id]
  );

  if (conCertificado.length === 0 && sinCertificado.length === 0) return null;

  return (
    <div className="border-t border-stone-100 pt-4 space-y-3">
      <p className="text-stone-400 text-xs font-medium flex items-center gap-1.5">
        <span>🛡</span> Certificados blockchain
      </p>

      {conCertificado.map((item) => {
        const cert = item.certificate || item.certificado;
        return (
          <div key={item._id || item.id} className="bg-stone-50 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-medium text-stone-700">{item.nombre || item.name || item.productId}</p>
            <div className="flex items-center justify-between">
              <EtherscanLink txHash={cert.txHash} />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${certBadge[cert.status] || "bg-stone-100 text-stone-500"}`}>
                {cert.status}
              </span>
            </div>
          </div>
        );
      })}

      {sinCertificado.map((item) => {
        const itemId = item._id || item.id;
        const res = resultado[itemId];
        return (
          <div key={itemId} className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-stone-700">{item.nombre || item.name || item.productId}</p>
            {res ? (
              <div className="space-y-1">
                <span className="text-xs text-green-600 font-medium">Certificado emitido</span>
                <EtherscanLink txHash={res.txHash} />
              </div>
            ) : (
              <>
                {error[itemId] && (
                  <p className="text-xs text-red-500">{error[itemId]}</p>
                )}
                <button
                  onClick={() => emitir(pedido._id || pedido.id, itemId)}
                  disabled={emitiendo[itemId]}
                  className="w-full text-xs bg-stone-900 text-white px-3 py-1.5 rounded-md hover:bg-stone-700 transition-colors disabled:opacity-50"
                >
                  {emitiendo[itemId] ? "Emitiendo..." : "Emitir certificado"}
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtro, setFiltro] = useState("todos");
  const [seleccionado, setSeleccionado] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const LIMITE = 20;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { page: pagina, limit: LIMITE };
      if (filtro !== "todos") params.status = filtro;
      const res = await pedidosService.getAll(params);
      const resData = res.data;
      setPedidos(resData.orders || resData.data || resData || []);
      setTotal(resData.total || resData.count || 0);
    } catch (e) {
      setError(e.response?.data?.message || "Error al cargar pedidos");
    } finally {
      setCargando(false);
    }
  }, [pagina, filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (id, nuevoEstado, note = "") => {
    setCambiandoEstado(true);
    try {
      await pedidosService.cambiarEstado(id, nuevoEstado, note);
      setPedidos((prev) =>
        prev.map((p) => {
          const pid = p._id || p.id;
          return pid === id ? { ...p, status: nuevoEstado, estado: nuevoEstado } : p;
        })
      );
      if (seleccionado && (seleccionado._id || seleccionado.id) === id) {
        setSeleccionado((prev) => ({ ...prev, status: nuevoEstado, estado: nuevoEstado }));
      }
    } catch (e) {
      alert(e.response?.data?.message || "Error al cambiar estado");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const totalPaginas = Math.ceil(total / LIMITE);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Pedidos</h2>
          <p className="text-stone-500 text-sm mt-1">{total} pedidos en total</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={cargar} className="text-xs text-red-700 font-medium hover:underline">Reintentar</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {["todos", ...estadoOpciones].map((f) => (
          <button
            key={f}
            onClick={() => { setFiltro(f); setPagina(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
              ${filtro === f ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Tabla */}
        <div className="flex-1 space-y-3">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {["Pedido", "Cliente", "Fecha", "Total", "Estado", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="border-b border-stone-100 animate-pulse">
                      <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-20"></div></td>
                      <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-28"></div></td>
                      <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-20"></div></td>
                      <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-16"></div></td>
                      <td className="px-4 py-3"><div className="h-4 bg-stone-100 rounded-full w-20"></div></td>
                      <td></td>
                    </tr>
                  ))
                ) : pedidos.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-stone-400 text-sm">No hay pedidos</td></tr>
                ) : pedidos.map((p) => {
                  const pid = p._id || p.id;
                  const estado = p.status || p.estado;
                  const selId = seleccionado?._id || seleccionado?.id;
                  return (
                    <tr
                      key={pid}
                      onClick={() => setSeleccionado(p)}
                      className={`border-b border-stone-100 cursor-pointer transition-colors hover:bg-stone-50 ${selId === pid ? "bg-amber-50" : ""}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">{p.orderNumber || pid?.slice(-8) || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-800">{p.cliente?.nombre || p.cliente || "—"}</p>
                        <p className="text-xs text-stone-400">{p.cliente?.email || p.email || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-stone-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES") : p.fecha || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-stone-700">
                        {(p.total || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[estado] || "bg-stone-100 text-stone-600"}`}>
                          {estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-400 text-xs">›</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-stone-400">Página {pagina} de {totalPaginas}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                  className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas}
                  className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detalle */}
        {seleccionado && (() => {
          const estado = seleccionado.status || seleccionado.estado;
          return (
            <div className="w-80 bg-white rounded-xl border border-stone-200 p-5 space-y-4 self-start max-h-screen overflow-y-auto sticky top-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-800">
                  {seleccionado.orderNumber || (seleccionado._id || seleccionado.id)?.slice(-8)}
                </h3>
                <button onClick={() => setSeleccionado(null)} className="text-stone-400 hover:text-stone-700 text-sm">✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-stone-400 text-xs">Cliente</p>
                  <p className="font-medium text-stone-700">{seleccionado.cliente?.nombre || seleccionado.cliente || "—"}</p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Email</p>
                  <p className="text-stone-600">{seleccionado.cliente?.email || seleccionado.email || "—"}</p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Fecha</p>
                  <p className="text-stone-600">
                    {seleccionado.createdAt
                      ? new Date(seleccionado.createdAt).toLocaleDateString("es-ES")
                      : seleccionado.fecha || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 text-xs">Total</p>
                  <p className="font-bold text-stone-800">
                    {(seleccionado.total || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                  </p>
                </div>
                {(seleccionado.items || seleccionado.productos)?.length > 0 && (
                  <div>
                    <p className="text-stone-400 text-xs mb-1">Productos</p>
                    {(seleccionado.items || seleccionado.productos).map((pr, i) => (
                      <p key={i} className="text-stone-600 text-xs">
                        · {typeof pr === "string" ? pr : (pr.nombre || pr.name || pr.productId)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-stone-400 text-xs mb-2">Cambiar estado</p>
                <div className="flex flex-wrap gap-1.5">
                  {estadoOpciones.map((e) => (
                    <button
                      key={e}
                      onClick={() => cambiarEstado(seleccionado._id || seleccionado.id, e)}
                      disabled={cambiandoEstado || estado === e}
                      className={`text-xs px-2 py-1 rounded-md capitalize transition-all disabled:opacity-60
                        ${estado === e
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <PanelCertificados pedido={seleccionado} />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
