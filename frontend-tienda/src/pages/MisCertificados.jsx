import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { certificadosService } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

function truncateHash(hash, chars = 8) {
  if (!hash) return "—";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export default function MisCertificados() {
  const { cliente } = useAuth();
  const navigate = useNavigate();
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cliente) {
      navigate("/");
      return;
    }
    certificadosService
      .getMios()
      .then((data) => setCertificados(data.certificates || data || []))
      .catch(() => setError("No se pudieron cargar tus certificados."))
      .finally(() => setLoading(false));
  }, [cliente, navigate]);

  return (
    <div className="container-aurea py-16">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Tu cuenta</p>
        <h1 className="font-serif text-4xl mt-2">Mis certificados</h1>
        <div className="section-divider" />
        <p className="text-stone-600 max-w-xl">
          Cada prenda adquirida con certificación incluye un registro inmutable en la blockchain de Ethereum.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-stone-100 animate-pulse rounded" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-6 border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {!loading && !error && certificados.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6 text-stone-300">
            <ShieldIcon size={40} />
          </div>
          <p className="font-serif text-2xl text-ink mb-2">Aún no tienes certificados</p>
          <p className="text-stone-500 text-sm mb-8">
            Los certificados se emiten automáticamente al comprar prendas certificables.
          </p>
          <Link to="/tienda" className="btn-primary">Explorar colección</Link>
        </div>
      )}

      {!loading && !error && certificados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificados.map((cert) => (
            <CertificadoCard key={cert._id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertificadoCard({ cert }) {
  const nombre = cert.productName || cert.product?.name || "Prenda certificada";
  const imagen =
    cert.productImage ||
    cert.product?.coverImage ||
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80";
  const serial = cert.serialNumber || cert.serial || "—";
  const txHash = cert.transactionHash || cert.txHash;
  const slug = cert.publicSlug || cert.slug || cert._id;

  return (
    <div className="border border-stone-200 overflow-hidden group hover:border-aurea-300 transition-colors">
      {/* Imagen */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={imagen}
          alt={nombre}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <span className="flex items-center gap-1 bg-green-600 text-white text-[10px] uppercase tracking-widest px-2 py-1">
            <CheckSmallIcon />
            Verificado
          </span>
        </div>
      </div>

      {/* Datos */}
      <div className="p-5">
        <p className="text-[10px] uppercase tracking-widest text-aurea-600 mb-1">Certificado Aurea</p>
        <h3 className="font-serif text-lg text-ink leading-tight mb-4">{nombre}</h3>

        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-stone-400 uppercase tracking-widest">Serie</dt>
            <dd className="font-mono text-ink">{serial}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone-400 uppercase tracking-widest">Emitido</dt>
            <dd className="text-ink">{formatDate(cert.issuedAt || cert.createdAt)}</dd>
          </div>
          {txHash && (
            <div className="flex justify-between">
              <dt className="text-stone-400 uppercase tracking-widest">Tx Hash</dt>
              <dd className="font-mono text-ink">{truncateHash(txHash)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 pt-4 border-t border-stone-100">
          <Link
            to={`/certificado/${slug}`}
            className="btn-outline w-full text-center text-xs"
          >
            Ver certificado
          </Link>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
