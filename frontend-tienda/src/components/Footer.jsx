export default function Footer() {
  return (
    <footer className="bg-ink text-cream/80 mt-24">
      <div className="container-aurea py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-serif text-2xl text-cream tracking-widest">AUREA</h3>
          <p className="text-sm mt-4 leading-relaxed">
            Moda con certificado de autenticidad verificable en blockchain.
            Cada prenda, una historia única.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-cream mb-4">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/tienda/mujer" className="hover:text-aurea-400">Mujer</a></li>
            <li><a href="/tienda/hombre" className="hover:text-aurea-400">Hombre</a></li>
            <li><a href="/tienda/accesorios" className="hover:text-aurea-400">Accesorios</a></li>
            <li><a href="/tienda" className="hover:text-aurea-400">Novedades</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-cream mb-4">Ayuda</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-aurea-400">Envíos y devoluciones</a></li>
            <li><a href="#" className="hover:text-aurea-400">Guía de tallas</a></li>
            <li><a href="#" className="hover:text-aurea-400">Verificar certificado</a></li>
            <li><a href="#" className="hover:text-aurea-400">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-cream mb-4">Newsletter</h4>
          <p className="text-sm mb-3">Recibe nuestras novedades y colecciones exclusivas.</p>
          <form className="flex">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-3 py-2 bg-transparent border border-cream/30 text-sm placeholder-cream/40 focus:outline-none focus:border-aurea-500"
            />
            <button className="px-4 bg-aurea-500 text-ink text-xs uppercase tracking-widest hover:bg-aurea-400 transition-colors">
              OK
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="container-aurea py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-cream/50">
          <p>© {new Date().getFullYear()} Aurea — TFG DAW · Elena & Bohdan</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-aurea-400">Aviso legal</a>
            <a href="#" className="hover:text-aurea-400">Privacidad</a>
            <a href="#" className="hover:text-aurea-400">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
