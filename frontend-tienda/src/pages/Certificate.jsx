import { useParams } from "react-router-dom";

export default function Certificate() {
  const { serial } = useParams();

  return (
    <div className="container-aurea py-16 max-w-3xl">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Verificación de autenticidad</p>
        <h1 className="font-serif text-5xl mt-2">Certificado Aurea</h1>
        <div className="section-divider mx-auto" />
      </div>

      <div className="border border-aurea-200 bg-cream shadow-sm">
        <div className="bg-ink text-cream p-8 flex justify-between items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-aurea-300">Certificado nº</p>
            <p className="font-serif text-3xl mt-1">AUR-2026-{serial?.slice(0, 4) || "0001"}</p>
          </div>
          <span className="px-3 py-1 bg-aurea-500 text-ink text-xs uppercase tracking-widest">Verificado</span>
        </div>

        <dl className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <Field label="Producto" value="Vestido Aurora" />
          <Field label="Número de serie" value={serial || "AURA-2026-0001"} />
          <Field label="Marca" value="Aurea" />
          <Field label="País de origen" value="España" />
          <Field label="Materiales" value="100% Seda" />
          <Field label="Fecha de emisión" value="2026-05-13" />
          <Field label="Red" value="Ethereum Sepolia" />
          <Field label="Contrato" value="0xC4...8FfE" mono />
          <Field label="Tx hash" value="0x4f8a37b2...c19b29c" mono full />
          <Field label="Propietario" value="0x71C...3aB2" mono />
        </dl>

        <div className="border-t border-stone-200 p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-32 h-32 bg-stone-100 flex items-center justify-center">
            <QRPlaceholder />
          </div>
          <div className="text-sm text-stone-600 leading-relaxed">
            Escanea este código QR desde tu móvil o copia el hash de la transacción para verificar el
            certificado directamente en Etherscan. Este certificado es <strong className="text-ink">inmutable</strong>
            y prueba la autenticidad y trazabilidad de tu prenda.
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

function QRPlaceholder() {
  // QR estilizado como mosaico de cuadrados (decorativo, no real)
  const cells = Array.from({ length: 49 }, (_, i) =>
    ((i * 7 + (i % 5)) % 3 === 0) ? 1 : 0
  );
  return (
    <div className="grid grid-cols-7 gap-px w-24 h-24">
      {cells.map((c, i) => (
        <div key={i} className={c ? "bg-ink" : "bg-cream"} />
      ))}
    </div>
  );
}
