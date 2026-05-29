import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { pedidosService } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatPrice(v) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v || 0);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

const statusStyles = {
  pending: "bg-stone-100 text-stone-600",
  processing: "bg-blue-50 text-blue-700",
  paid: "bg-aurea-100 text-aurea-800",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

const statusLabels = {
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function MisPedidos() {
  const { cliente } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    if (!cliente) {
      navigate("/");
      return;
    }
    pedidosService
      .getMios()
      .then((data) => setPedidos(data.orders || data || []))
      .catch(() => setError("No se pudieron cargar tus pedidos."))
      .finally(() => setLoading(false));
  }, [cliente, navigate]);

  const toggleExpandir = (id) => setExpandido((prev) => (prev === id ? null : id));

  return (
    <div className="container-aurea py-16 max-w-3xl">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Tu cuenta</p>
        <h1 className="font-serif text-4xl mt-2">Mis pedidos</h1>
        <div className="section-divider" />
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-stone-100 animate-pulse rounded" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-6 border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {!loading && !error && pedidos.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6 text-stone-300">
            <BoxIcon />
          </div>
          <p className="font-serif text-2xl text-ink mb-2">Aún no tienes pedidos</p>
          <p className="text-stone-500 text-sm mb-8">Explora nuestra colección y realiza tu primera compra.</p>
          <Link to="/tienda" className="btn-primary">Ver colección</Link>
        </div>
      )}

      {!loading && !error && pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const isOpen = expandido === pedido._id;
            const status = pedido.status || "pending";
            return (
              <div key={pedido._id} className="border border-stone-200">
                {/* Fila resumen */}
                <button
                  onClick={() => toggleExpandir(pedido._id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-stone-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-stone-400">Pedido</p>
                      <p className="font-mono text-sm text-ink font-medium">{pedido.orderNumber || pedido._id?.slice(-8)}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] uppercase tracking-widest text-stone-400">Fecha</p>
                      <p className="text-sm text-ink">{formatDate(pedido.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-stone-400">Artículos</p>
                      <p className="text-sm text-ink">{pedido.items?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-ink">{formatPrice(pedido.total)}</p>
                      <span className={`inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${statusStyles[status] || statusStyles.pending}`}>
                        {statusLabels[status] || status}
                      </span>
                    </div>
                    <ChevronIcon open={isOpen} />
                  </div>
                </button>

                {/* Detalle expandido */}
                {isOpen && (
                  <div className="border-t border-stone-200 p-5 bg-stone-50/50 space-y-5">
                    {/* Items */}
                    {pedido.items?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">Productos</p>
                        <div className="space-y-3">
                          {pedido.items.map((item, idx) => {
                            const nombre = item.name || item.product?.name || "Producto";
                            const img = item.image || item.product?.coverImage || "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&q=80";
                            const precio = item.price || item.product?.price || 0;
                            return (
                              <div key={idx} className="flex items-center gap-4">
                                <div className="w-12 h-14 bg-stone-100 flex-shrink-0">
                                  <img src={img} alt={nombre} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-ink truncate">{nombre}</p>
                                  {item.variantSku && <p className="text-[10px] text-stone-400">{item.variantSku}</p>}
                                </div>
                                <p className="text-sm text-stone-600 flex-shrink-0">
                                  {item.quantity}× {formatPrice(precio)}
                                </p>
                                {item.certificateSlug && (
                                  <Link
                                    to={`/certificado/${item.certificateSlug}`}
                                    className="text-[10px] uppercase tracking-widest text-aurea-600 hover:underline flex-shrink-0"
                                  >
                                    Ver cert.
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Envío */}
                    {pedido.shippingAddress && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Dirección de envío</p>
                        <p className="text-sm text-ink">{pedido.shippingAddress.recipient}</p>
                        <p className="text-sm text-stone-600">
                          {pedido.shippingAddress.line1}, {pedido.shippingAddress.city} {pedido.shippingAddress.postalCode}
                        </p>
                      </div>
                    )}

                    {/* Tracking */}
                    {pedido.trackingNumber && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Número de seguimiento</p>
                        <p className="font-mono text-sm text-ink">{pedido.trackingNumber}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""} text-stone-400`}
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}
