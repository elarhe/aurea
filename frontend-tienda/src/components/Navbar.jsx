import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const nav = [
  { to: "/tienda/mujer", label: "Mujer" },
  { to: "/tienda/hombre", label: "Hombre" },
  { to: "/tienda/accesorios", label: "Accesorios" },
  { to: "/tienda", label: "Novedades" },
];

export default function Navbar({ onAbrirAuth }) {
  const { cliente, logout } = useAuth();
  const { itemCount, openDrawer } = useCart();
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenu(false);
    navigate("/");
  };

  const nombreMostrado = cliente
    ? cliente.firstName || cliente.nombre || cliente.name || "U"
    : "U";

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-stone-200">
      <div className="container-aurea flex items-center justify-between py-5">
        {/* Logo */}
        <Link to="/" className="font-serif text-3xl tracking-widest text-ink">
          AUREA
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-10">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-xs uppercase tracking-widest transition-colors ${
                  isActive ? "text-aurea-600" : "text-ink hover:text-aurea-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Iconos */}
        <div className="flex items-center gap-5">
          <button aria-label="Buscar" className="hover:text-aurea-600">
            <SearchIcon />
          </button>

          {/* Botón usuario con dropdown */}
          <div className="relative hidden sm:block" ref={userMenuRef}>
            {cliente ? (
              <>
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 hover:text-aurea-600 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-ink text-cream flex items-center justify-center text-xs font-medium">
                    {nombreMostrado[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-10 w-56 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-ink truncate">{nombreMostrado}</p>
                      <p className="text-xs text-stone-400 truncate">{cliente.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/mis-pedidos"
                        onClick={() => setUserMenu(false)}
                        className="flex w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Mis pedidos
                      </Link>
                      <Link
                        to="/mis-certificados"
                        onClick={() => setUserMenu(false)}
                        className="flex w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Mis certificados
                      </Link>
                      <Link
                        to="/perfil"
                        onClick={() => setUserMenu(false)}
                        className="flex w-full text-left px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        Mi perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-stone-100"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                aria-label="Cuenta"
                onClick={onAbrirAuth}
                className="hover:text-aurea-600 transition-colors"
              >
                <UserIcon />
              </button>
            )}
          </div>

          <button aria-label="Favoritos" className="hidden sm:block hover:text-aurea-600">
            <HeartIcon />
          </button>

          {/* Carrito — abre drawer */}
          <button
            aria-label="Carrito"
            onClick={openDrawer}
            className="relative hover:text-aurea-600"
          >
            <BagIcon />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-aurea-500 text-cream text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          <button
            aria-label="Menú"
            className="md:hidden ml-2"
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Nav mobile */}
      {open && (
        <nav className="md:hidden border-t border-stone-200 bg-cream">
          <ul className="container-aurea py-4 space-y-3">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block text-sm uppercase tracking-widest text-ink"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="border-t border-stone-200 pt-3 space-y-2">
              {cliente ? (
                <>
                  <Link to="/mis-pedidos" onClick={() => setOpen(false)} className="block text-sm text-stone-600">Mis pedidos</Link>
                  <Link to="/mis-certificados" onClick={() => setOpen(false)} className="block text-sm text-stone-600">Mis certificados</Link>
                  <Link to="/perfil" onClick={() => setOpen(false)} className="block text-sm text-stone-600">Mi perfil</Link>
                  <button onClick={() => { handleLogout(); setOpen(false); }} className="block text-sm text-red-500">Cerrar sesión</button>
                </>
              ) : (
                <>
                  <button onClick={() => { onAbrirAuth(); setOpen(false); }} className="block text-sm text-stone-600">Iniciar sesión</button>
                </>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

/* ---------- Iconos inline ---------- */
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 21s-7-4.5-9.5-9.5C.5 7 4 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3 0 6.5 3 4.5 7.5C19 16.5 12 21 12 21z" />
    </svg>
  );
}
function BagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
