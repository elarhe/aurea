import { useState, useEffect, useCallback } from "react";
import { certificadosService } from "../services/api";

const certBadge = {
  issued: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-600",
  revoked: "bg-stone-100 text-stone-500",
};

const certLabel = {
  issued: "Emitido",
  pending: "Pendiente",
  failed: "Fallido",
  revoked: "Revocado",
};

function truncHash(hash, start = 10, end = 8) {
  if (!hash) return "—";
  if (hash.length <= start + end + 3) return hash;
  return hash.slice(0, start) + "..." + hash.slice(-end);
}

function EtherscanLink({ txHash, network = "sepolia" }) {
  if (!txHash) return <span className="text-stone-400 text-xs">Sin tx hash</span>;
  const base = network === "sepolia"
    ? "https://sepolia.etherscan.io/tx/"
    : "https://etherscan.io/tx/";
  return (
    <a
      href={`${base}${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline font-mono text-xs flex items-center gap-1"
    >
      {truncHash(txHash, 8, 6)}
      <span className="text-blue-400">↗</span>
    </a>
  );
}

function BadgeEstado({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${certBadge[status] || "bg-stone-100 text-stone-500"}`}>
      {certLabel[status] || status || "—"}
    </span>
  );
}

function ModalDetalle({ cert, onCerrar }) {
  if (!cert) return null;
  const verUrl = cert.verificationUrl || (cert.txHash ? `https://sepolia.etherscan.io/tx/${cert.txHash}` : null);
  const qrUrl = verUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(verUrl)}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡</span>
            <h3 className="text-lg font-bold text-stone-800">Certificado blockchain</h3>
          </div>
          <button onClick={onCerrar} className="text-stone-400 hover:text-stone-700 text-xl leading-none">✕</button>
        </div>

        <div className="flex items-start gap-4">
          {qrUrl ? (
            <img src={qrUrl} alt="QR verificación" className="w-32 h-32 rounded-lg border border-stone-200 flex-shrink-0" />
          ) : (
            <div className="w-32 h-32 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-center text-stone-300 text-xs flex-shrink-0">
              Sin QR
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-stone-400">Estado</p>
              <BadgeEstado status={cert.status} />
            </div>
            <div>
              <p className="text-xs text-stone-400">Número de serie</p>
              <p className="font-mono text-sm text-stone-700">{cert.serialNumber || cert._id?.slice(-10) || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Fecha de emisión</p>
              <p className="text-sm text-stone-600">
                {cert.issuedAt || cert.createdAt
                  ? new Date(cert.issuedAt || cert.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Producto</p>
            <p className="text-stone-700 font-medium">{cert.product?.name || cert.producto || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Cliente</p>
            <p className="text-stone-700">{cert.customer?.nombre || cert.customer?.name || cert.cliente || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Red blockchain</p>
            <p className="text-stone-700 font-mono text-xs">{cert.network || "sepolia"}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 mb-0.5">Verificaciones</p>
            <p className="text-stone-700 font-semibold">{cert.verificationCount ?? cert.verificaciones ?? 0}</p>
          </div>
          {cert.contractAddress && (
            <div className="col-span-2">
              <p className="text-xs text-stone-400 mb-0.5">Contrato</p>
              <p className="font-mono text-xs text-stone-600 break-all">{cert.contractAddress}</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-xs text-stone-400 mb-0.5">Tx Hash</p>
            <EtherscanLink txHash={cert.txHash} network={cert.network || "sepolia"} />
          </div>
          {cert.tokenId && (
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Token ID</p>
              <p className="font-mono text-xs text-stone-600">{cert.tokenId}</p>
            </div>
          )}
          {cert.ipfsHash && (
            <div>
              <p className="text-xs text-stone-400 mb-0.5">IPFS Hash</p>
              <p className="font-mono text-xs text-stone-600 truncate">{cert.ipfsHash}</p>
            </div>
          )}
        </div>

        {verUrl && (
          <a
            href={verUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white text-sm px-4 py-2.5 rounded-lg hover:bg-stone-700 transition-colors"
          >
            Ver en Etherscan ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default function Certificados() {
  const [certificados, setCertificados] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ issued: 0, pending: 0, failed: 0 });
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroNetwork, setFiltroNetwork] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const LIMITE = 20;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = { page: pagina, limit: LIMITE };
      if (filtroStatus !== "todos") params.status = filtroStatus;
      if (filtroNetwork !== "todos") params.network = filtroNetwork;
      const res = await certificadosService.getAll(params);
      const resData = res.data;
      const lista = resData.certificates || resData.data || resData || [];
      setCertificados(lista);
      setTotal(resData.total || resData.count || lista.length || 0);

      // Stats rápidas desde los datos o del resumen
      if (resData.stats) {
        setStats(resData.stats);
      } else {
        setStats({
          issued: lista.filter((c) => c.status === "issued").length,
          pending: lista.filter((c) => c.status === "pending").length,
          failed: lista.filter((c) => c.status === "failed").length,
        });
      }
    } catch (e) {
      setError(e.response?.data?.message || "Error al cargar certificados");
    } finally {
      setCargando(false);
    }
  }, [pagina, filtroStatus, filtroNetwork]);

  useEffect(() => { cargar(); }, [cargar]);

  const totalPaginas = Math.ceil(total / LIMITE);

  return (
    <div className="p-8 space-y-6">
      {seleccionado && (
        <ModalDetalle cert={seleccionado} onCerrar={() => setSeleccionado(null)} />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <span>🛡</span> Certificados blockchain
          </h2>
          <p className="text-stone-500 text-sm mt-1">{total} certificados en total</p>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Emitidos", value: stats.issued ?? 0, color: "text-green-700", bg: "bg-green-50 border-green-200" },
          { label: "Pendientes", value: stats.pending ?? 0, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Fallidos", value: stats.failed ?? 0, color: "text-red-600", bg: "bg-red-50 border-red-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className="text-stone-500 text-xs uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={cargar} className="text-xs text-red-700 font-medium hover:underline">Reintentar</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-2">
          {["todos", "issued", "pending", "failed", "revoked"].map((f) => (
            <button
              key={f}
              onClick={() => { setFiltroStatus(f); setPagina(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filtroStatus === f ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}
            >
              {f === "todos" ? "Todos" : certLabel[f] || f}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-stone-200"></div>
        <div className="flex gap-2">
          {["todos", "sepolia", "localhost"].map((n) => (
            <button
              key={n}
              onClick={() => { setFiltroNetwork(n); setPagina(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filtroNetwork === n ? "bg-stone-800 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}
            >
              {n === "todos" ? "Todas las redes" : n}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                {["Certificado", "Producto", "Cliente", "Nº serie", "Fecha emisión", "Tx Hash", "Estado"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-stone-100 animate-pulse">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-stone-100 rounded w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : certificados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-stone-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🛡</span>
                      <p>No hay certificados{filtroStatus !== "todos" ? ` con estado "${certLabel[filtroStatus] || filtroStatus}"` : ""}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                certificados.map((c) => {
                  const cid = c._id || c.id;
                  const fecha = c.issuedAt || c.createdAt;
                  return (
                    <tr
                      key={cid}
                      onClick={() => setSeleccionado(c)}
                      className="border-b border-stone-100 cursor-pointer transition-colors hover:bg-stone-50"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-stone-500">
                          {cid?.slice(-8) || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-stone-800 text-xs">{c.product?.name || c.producto || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-stone-600 text-xs">{c.customer?.nombre || c.customer?.name || c.cliente || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-stone-500">{c.serialNumber || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {fecha ? new Date(fecha).toLocaleDateString("es-ES") : "—"}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <EtherscanLink txHash={c.txHash} network={c.network || "sepolia"} />
                      </td>
                      <td className="px-4 py-3">
                        <BadgeEstado status={c.status} />
                      </td>
                    </tr>
                  );
                })
              )}
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
    </div>
  );
}
