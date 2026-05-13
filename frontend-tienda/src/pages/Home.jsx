import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { mockProducts } from "../data/mockProducts.js";

export default function Home() {
  const featured = mockProducts.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[78vh] min-h-[520px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=80"
          alt="Aurea SS26"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/30 to-transparent" />
        <div className="relative container-aurea h-full flex items-center">
          <div className="max-w-xl text-cream">
            <p className="text-xs uppercase tracking-widest text-aurea-300">Colección SS26 · Aurora</p>
            <h1 className="font-serif text-5xl md:text-7xl mt-4 leading-tight">
              Cada prenda,<br />una historia única.
            </h1>
            <div className="section-divider bg-aurea-300" />
            <p className="text-base text-cream/85 max-w-md mb-8 leading-relaxed">
              Moda atemporal con certificado de autenticidad verificable en blockchain.
              Trazabilidad, sostenibilidad y elegancia en cada pieza.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/tienda" className="btn-primary bg-cream text-ink hover:bg-aurea-500">
                Descubrir colección
              </Link>
              <Link to="/certificado/demo" className="btn-outline border-cream text-cream hover:bg-cream hover:text-ink">
                Verificar certificado
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="container-aurea py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-aurea-600">Universos Aurea</p>
          <h2 className="font-serif text-4xl mt-2">Explora las categorías</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CategoryCard
            to="/tienda/mujer"
            label="Mujer"
            image="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80"
          />
          <CategoryCard
            to="/tienda/hombre"
            label="Hombre"
            image="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=900&q=80"
          />
          <CategoryCard
            to="/tienda/accesorios"
            label="Accesorios"
            image="https://images.unsplash.com/photo-1611923134239-b9be5816e23c?w=900&q=80"
          />
        </div>
      </section>

      {/* Destacados */}
      <section className="container-aurea py-20 border-t border-stone-200">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-aurea-600">Piezas destacadas</p>
            <h2 className="font-serif text-4xl mt-2">Selección curada</h2>
          </div>
          <Link to="/tienda" className="text-xs uppercase tracking-widest text-ink hover:text-aurea-600">
            Ver todo →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {/* Blockchain feature */}
      <section className="bg-ink text-cream py-24 mt-12">
        <div className="container-aurea grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-aurea-300">Tecnología que protege</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
              Certificados de autenticidad en blockchain.
            </h2>
            <div className="section-divider bg-aurea-500" />
            <p className="text-cream/80 leading-relaxed mb-6">
              Cada prenda Aurea lleva un certificado único registrado de forma inmutable
              en la blockchain de Ethereum. Verifica su origen, materiales y procedencia
              escaneando el código QR de la etiqueta.
            </p>
            <ul className="space-y-3 text-sm text-cream/80 mb-8">
              <li className="flex items-start gap-3"><Check /> Trazabilidad completa de origen y materiales</li>
              <li className="flex items-start gap-3"><Check /> Resistente a falsificaciones</li>
              <li className="flex items-start gap-3"><Check /> Transferible si revendes tu prenda</li>
            </ul>
            <Link to="/certificado/demo" className="btn-outline border-aurea-500 text-aurea-500 hover:bg-aurea-500 hover:text-ink">
              Ver certificado de ejemplo
            </Link>
          </div>
          <div className="relative">
            <div className="aspect-square bg-cream/5 border border-aurea-500/30 p-10 flex flex-col items-center justify-center text-center">
              <div className="text-aurea-500 mb-6">
                <BigShield />
              </div>
              <p className="text-xs uppercase tracking-widest text-aurea-300 mb-2">Certificado nº</p>
              <p className="font-serif text-3xl">AUR-2026-0001</p>
              <p className="text-cream/60 text-xs mt-6 break-all max-w-xs">
                0x4f8a...b29c · Ethereum Sepolia
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ to, label, image }) {
  return (
    <Link to={to} className="group relative aspect-[4/5] overflow-hidden block">
      <img
        src={image}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-8 text-cream">
        <h3 className="font-serif text-3xl">{label}</h3>
        <span className="text-xs uppercase tracking-widest mt-1 inline-block group-hover:text-aurea-300 transition-colors">
          Descubrir →
        </span>
      </div>
    </Link>
  );
}

function Check() {
  return (
    <svg className="text-aurea-500 mt-0.5 flex-shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BigShield() {
  return (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
