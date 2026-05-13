import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { mockProducts } from "../data/mockProducts.js";

export default function ProductDetail() {
  const { slug } = useParams();
  const product = mockProducts.find((p) => p.slug === slug) || mockProducts[0];
  const [size, setSize] = useState("M");

  return (
    <div className="container-aurea py-12">
      <nav className="text-xs uppercase tracking-widest text-stone-500 mb-8">
        <Link to="/" className="hover:text-ink">Inicio</Link> ·
        <Link to="/tienda" className="hover:text-ink ml-1">Tienda</Link> ·
        <span className="ml-1 text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Imagen */}
        <div className="aspect-[3/4] bg-stone-100 overflow-hidden">
          <img src={product.coverImage} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Info */}
        <div className="lg:py-8">
          <p className="text-xs uppercase tracking-widest text-aurea-600">{product.brand}</p>
          <h1 className="font-serif text-4xl mt-2">{product.name}</h1>
          <p className="text-2xl mt-4 text-ink">{formatPrice(product.price)}</p>
          {product.compareAtPrice && (
            <p className="text-sm text-stone-400 line-through">{formatPrice(product.compareAtPrice)}</p>
          )}

          <div className="section-divider" />

          <p className="text-stone-600 leading-relaxed">
            Una pieza atemporal confeccionada con materiales nobles. Cada {product.name.toLowerCase()} incluye
            su <strong className="text-ink">certificado de autenticidad en blockchain</strong>, garantizando su origen
            y trazabilidad.
          </p>

          {/* Tallas */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-stone-600 mb-3">Talla</p>
            <div className="flex gap-2">
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-12 h-12 border text-sm transition-colors ${
                    size === s
                      ? "border-ink bg-ink text-cream"
                      : "border-stone-300 text-ink hover:border-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button className="btn-primary flex-1">Añadir al carrito</button>
            <button className="btn-outline">♡ Guardar</button>
          </div>

          {/* Certificación */}
          <div className="mt-10 p-5 border border-aurea-200 bg-aurea-50/40 flex items-start gap-4">
            <span className="text-aurea-600 mt-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" opacity=".2" />
                <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3zm-1 14.25-4-4 1.4-1.45L11 13.4l5.6-5.6L18 9.2l-7 7z" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Certificado de autenticidad incluido</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Al recibir tu prenda podrás verificar su autenticidad mediante un código único registrado
                en la blockchain de Ethereum.
              </p>
            </div>
          </div>

          {/* Detalles */}
          <details className="mt-6 border-t border-stone-200 pt-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest">Composición y cuidados</summary>
            <p className="text-sm text-stone-600 mt-3">100% materiales naturales. Lavar a mano en agua fría. Planchar a baja temperatura.</p>
          </details>
          <details className="mt-2 border-t border-stone-200 pt-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest">Envío y devoluciones</summary>
            <p className="text-sm text-stone-600 mt-3">Envío gratuito en pedidos superiores a 100€. Devoluciones gratuitas durante 30 días.</p>
          </details>
        </div>
      </div>
    </div>
  );
}

function formatPrice(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
