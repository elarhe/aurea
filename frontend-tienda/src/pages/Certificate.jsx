import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { certificadosService } from "../services/api.js";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

function truncateHash(hash, chars = 10) {
  if (!hash) return "—";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export default function Certificate() {
  const { serial } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const verifyUrl = `${window.location.origin}/certificado/${serial}`;

  useEffect(() => {
    certificadosService
      .verificar(serial)
      .then((data) => {
        setCert(data.certificate || data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [serial]);

  if (loading) {
    return (
      <div className="container-aurea py-16 max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-aurea-600">Verificación de autenticidad</p>
          <h1 className="font-serif text-5xl mt-2">Certificado Aurea</h1>
          <div className="section-divider mx-auto" />
        </div>
        <div className="border border-aurea-200">
          <div className="bg-ink p-8 animate-pulse h-24" />
          <div className="p-8 grid grid-cols-2 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-2 bg-stone-200 rounded w-16 animate-pulse" />
                <div className="h-4 bg-stone-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container-aurea py-16 max-w-3xl text-center">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Verificación de autenticidad</p>
        <h1 className="font-serif text-5xl mt-2 mb-6">Certificado Aurea</h1>
        <div className="border border-red-200 bg-red-50 p-12">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircleIcon />
          </div>
          <p className="font-serif text-2xl text-ink mb-2">Certificado no encontrado</p>
          <p className="text-stone-600 text-sm">
            El número de serie <span className="font-mono">{serial}</span> no corresponde a ningún
            certificado registrado en la blockchain de Aurea.
          </p>
        </div>
        <p className="text-xs text-stone-400 mt-8">Aurea — Certificación blockchain · TFG DAW 2026</p>
      </div>
    );
  }

  const txHash = cert.transactionHash || cert.txHash;
  const contractAddress = cert.contractAddress;
  const etherscanUrl = txHash
    ? `https://sepolia.etherscan.io/tx/${txHash}`
    : null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <div className="container-aurea py-16 max-w-3xl">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Verificación de autenticidad</p>
        <h1 className="font-serif text-5xl mt-2">Certificado Aurea</h1>
        <div className="section-divider mx-auto" />
      </div>

      <div className="border border-aurea-200 bg-cream shadow-sm">
        {/* Header */}
        <div className="bg-ink text-cream p-8 flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-aurea-300">Certificado nº</p>
            <p className="font-serif text-3xl mt-1">{cert.serialNumber || serial}</p>
          </div>
          <span className={`px-3 py-1 text-xs uppercase tracking-widest ${
            cert.verified !== false ? "bg-aurea-500 text-ink" : "bg-red-400 text-white"
          }`}>
            {cert.verified !== false ? "Verificado" : "No verificado"}
          </span>
        </div>

        {/* Datos */}
        <dl className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <Field label="Producto" value={cert.productName || cert.product?.name || "—"} />
          <Field label="Número de serie" value={cert.serialNumber || serial} />
          <Field label="Marca" value={cert.brand || "Aurea"} />
          <Field label="Fecha de emisión" value={formatDate(cert.issuedAt || cert.createdAt)} />
          <Field label="Red" value={cert.network || "Ethereum Sepolia"} />
          <Field label="Propietario" value={cert.ownerAddress ? truncateHash(cert.ownerAddress) : "—"} mono />
          {contractAddress && (
            <Field label="Contrato" value={truncateHash(contractAddress)} mono />
          )}
          {txHash && (
            <Field label="Tx hash" value={truncateHash(txHash, 14)} mono full />
          )}
        </dl>

        {/* QR y Etherscan */}
        <div className="border-t border-stone-200 p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 bg-stone-100 flex items-center justify-center flex-shrink-0">
            <img
              src={qrUrl}
              alt="QR de verificación"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
          <div className="text-sm text-stone-600 leading-relaxed">
            <p>
              Escanea este código QR desde tu móvil para verificar el certificado.
              Este certificado es <strong className="text-ink">inmutable</strong> y prueba la
              autenticidad y trazabilidad de tu prenda.
            </p>
            {etherscanUrl && (
              <a
                href={etherscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs uppercase tracking-widest text-aurea-600 hover:text-aurea-800 transition-colors"
              >
                Ver en Etherscan
                <ExternalIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-stone-500 text-center mt-8">
        Aurea — Certificación blockchain · TFG DAW 2026
      </p>
    </div>
  );
}

function Field({ label, value, mono, full }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] uppercase tracking-widest text-stone-500">{label}</dt>
      <dd className={`mt-1 text-ink ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</dd>
    </div>
  );
}

function XCircleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-500">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" strokeLinecap="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
