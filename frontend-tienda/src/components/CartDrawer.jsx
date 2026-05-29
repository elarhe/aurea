import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

function formatPrice(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

export default function CartDrawer() {
  const { carrito, itemCount, drawerOpen, closeDrawer, actualizarItem, eliminarItem, aplicarCupon } = useCart();
  const [cupon, setCupon] = useState("");
  const [cuponLoading, setCuponLoading] = useState(false);
  const [cuponError, setCuponError] = useState(null);
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  // Bloquear scroll cuando el drawer está abierto
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleAplicarCupon = async () => {
    if (!cupon.trim()) return;
    setCuponLoading(true);
    setCuponError(null);
    try {
      await aplicarCupon(cupon.trim());
    } catch (e) {
      setCuponError(e.response?.data?.message || "Cupón no válido");
    } finally {
      setCuponLoading(false);
    }
  };

  const handleCheckout = () => {
    closeDrawer();
    navigate("/checkout");
  };

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="flex-1 bg-ink/40 backdrop-blur-sm"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className="w-full max-w-md bg-cream flex flex-col shadow-2xl"
        style={{ animation: "slideInRight 0.3s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <h2 className="font-serif text-xl">
            Tu carrito
            {itemCount > 0 && (
              <span className="ml-2 text-sm font-sans text-stone-500">({itemCount} {itemCount === 1 ? "pieza" : "piezas"})</span>
            )}
          </h2>
          <button onClick={closeDrawer} className="text-stone-400 hover:text-ink transition-colors" aria-label="Cerrar carrito">
            <XIcon />
          </button>
        </div>

        {/* Contenido */}
        {(!carrito.items || carrito.items.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-300">
              <BagEmptyIcon />
            </div>
            <div>
              <p className="font-serif text-2xl text-ink">Tu carrito está vacío</p>
              <p className="text-stone-500 text-sm mt-2">Descubre nuestra colección y añade tus piezas favoritas.</p>
            </div>
            <button onClick={() => { closeDrawer(); navigate("/tienda"); }} className="btn-primary">
              Ver colección
            </button>
          </div>
        ) : (
          <>
            {/* Lista de items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {carrito.items.map((item) => (
                <CartItem
                  key={item._id || item.productId}
                  item={item}
                  onActualizar={actualizarItem}
                  onEliminar={eliminarItem}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 px-6 py-5 space-y-4">
              {/* Cupón */}
              {!carrito.couponCode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de descuento"
                    value={cupon}
                    onChange={(e) => setCupon(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAplicarCupon()}
                    className="flex-1 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-aurea-500 bg-white"
                  />
                  <button
                    onClick={handleAplicarCupon}
                    disabled={cuponLoading}
                    className="btn-outline text-xs px-4"
                  >
                    {cuponLoading ? "..." : "Aplicar"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-aurea-700 font-medium">Cupón: {carrito.couponCode}</span>
                  <span className="text-aurea-700">- {formatPrice(carrito.discount)}</span>
                </div>
              )}
              {cuponError && <p className="text-red-500 text-xs">{cuponError}</p>}

              {/* Totales */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(carrito.subtotal)}</span>
                </div>
                {carrito.discount > 0 && (
                  <div className="flex justify-between text-aurea-700">
                    <span>Descuento</span>
                    <span>- {formatPrice(carrito.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-base text-ink pt-2 border-t border-stone-200 mt-2">
                  <span>Total estimado</span>
                  <span>{formatPrice(carrito.estimatedTotal)}</span>
                </div>
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">IVA incluido · Sin gastos de envío</p>
              </div>

              {/* CTAs */}
              <button onClick={handleCheckout} className="btn-primary w-full">
                Ir al checkout
              </button>
              <button onClick={closeDrawer} className="btn-outline w-full text-xs">
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function CartItem({ item, onActualizar, onEliminar }) {
  const [loading, setLoading] = useState(false);

  const cambiarCantidad = async (delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty < 1) return;
    setLoading(true);
    try {
      await onActualizar(item._id || item.productId, newQty);
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    setLoading(true);
    try {
      await onEliminar(item._id || item.productId);
    } finally {
      setLoading(false);
    }
  };

  const imageSrc =
    item.image ||
    item.coverImage ||
    item.product?.coverImage ||
    "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80";

  const nombre = item.name || item.product?.name || "Producto";
  const precio = item.price || item.product?.price || 0;

  return (
    <div className={`flex gap-4 ${loading ? "opacity-50" : ""}`}>
      <div className="w-20 h-24 flex-shrink-0 bg-stone-100 overflow-hidden">
        <img src={imageSrc} alt={nombre} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="font-serif text-sm text-ink leading-tight">{nombre}</p>
          <button onClick={eliminar} className="text-stone-300 hover:text-red-400 transition-colors flex-shrink-0" aria-label="Eliminar">
            <XSmallIcon />
          </button>
        </div>
        {(item.variantSku || item.talla) && (
          <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">
            {item.variantSku || item.talla}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-stone-200">
            <button
              onClick={() => cambiarCantidad(-1)}
              className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-ink"
            >
              −
            </button>
            <span className="w-7 text-center text-sm">{item.quantity || 1}</span>
            <button
              onClick={() => cambiarCantidad(1)}
              className="w-7 h-7 flex items-center justify-center text-stone-500 hover:text-ink"
            >
              +
            </button>
          </div>
          <span className="text-sm text-ink">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(precio * (item.quantity || 1))}
          </span>
        </div>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function BagEmptyIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M5 8h14l-1.2 11.2A2 2 0 0 1 15.8 21H8.2a2 2 0 0 1-2-1.8L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
