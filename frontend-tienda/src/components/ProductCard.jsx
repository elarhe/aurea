import { Link } from "react-router-dom";

/**
 * Tarjeta de producto. Espera un objeto product con:
 * { slug, name, brand, price, compareAtPrice, coverImage, isNew, certifiable }
 */
export default function ProductCard({ product }) {
  const { slug, name, brand, price, compareAtPrice, coverImage, isNew, certifiable } = product;
  const hasDiscount = compareAtPrice && compareAtPrice > price;

  return (
    <Link to={`/producto/${slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 font-serif text-2xl">
            {name?.charAt(0)}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="bg-ink text-cream text-[10px] uppercase tracking-widest px-2 py-1">
              Nuevo
            </span>
          )}
          {hasDiscount && (
            <span className="bg-aurea-500 text-ink text-[10px] uppercase tracking-widest px-2 py-1">
              Oferta
            </span>
          )}
        </div>

        {certifiable && (
          <span
            className="absolute top-3 right-3 text-aurea-600"
            title="Certificado de autenticidad en blockchain"
            aria-label="Certificado en blockchain"
          >
            <ShieldIcon />
          </span>
        )}
      </div>

      <div className="mt-4">
        {brand && (
          <p className="text-[10px] uppercase tracking-widest text-stone-500">{brand}</p>
        )}
        <h3 className="font-serif text-lg text-ink mt-1 leading-tight">{name}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-ink">{formatPrice(price)}</span>
          {hasDiscount && (
            <span className="text-xs text-stone-400 line-through">
              {formatPrice(compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" opacity=".15" />
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3zm0 2.2 6 2.25V11c0 4-2.7 7.85-6 9-3.3-1.15-6-5-6-9V6.45L12 4.2zm-1 12.05 6-6-1.4-1.4L11 13.4 8.4 10.8 7 12.25l4 4z" />
    </svg>
  );
}
