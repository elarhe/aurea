import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { pedidosService, usuariosService } from "../services/api.js";

function formatPrice(v) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v || 0);
}

const STEPS = ["Dirección", "Resumen", "Confirmación"];

export default function Checkout() {
  const { carrito, vaciarCarrito } = useCart();
  const { cliente } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const [direccionesSaved, setDireccionesSaved] = useState([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);

  const [form, setForm] = useState({
    recipient: cliente ? `${cliente.firstName || ""} ${cliente.lastName || ""}`.trim() : "",
    line1: "",
    city: "",
    postalCode: "",
    country: "ES",
  });

  const [formErrors, setFormErrors] = useState({});

  // Cargar direcciones guardadas si el usuario está autenticado
  useEffect(() => {
    if (cliente) {
      usuariosService.misDirectciones().then((data) => {
        setDireccionesSaved(data.addresses || data || []);
      }).catch(() => {});
    }
  }, [cliente]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => ({ ...e, [key]: null }));
  };

  const validateDireccion = () => {
    const errors = {};
    if (!form.recipient.trim()) errors.recipient = "Nombre del destinatario requerido";
    if (!form.line1.trim()) errors.line1 = "Dirección requerida";
    if (!form.city.trim()) errors.city = "Ciudad requerida";
    if (!form.postalCode.trim()) errors.postalCode = "Código postal requerido";
    if (!form.country.trim()) errors.country = "País requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSiguientePaso = () => {
    if (step === 0) {
      if (!validateDireccion()) return;
    }
    setStep((s) => s + 1);
  };

  const handleCrearPedido = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pedidosService.crear({
        shippingAddress: form,
        paymentMethod: "manual",
      });
      const pedido = data.order || data;
      setPedidoCreado(pedido);
      await vaciarCarrito().catch(() => {});
      setStep(2);
    } catch (e) {
      setError(e.response?.data?.message || "Error al crear el pedido. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const usarDireccionGuardada = (dir) => {
    setDireccionSeleccionada(dir._id);
    setForm({
      recipient: dir.recipient || `${cliente?.firstName || ""} ${cliente?.lastName || ""}`.trim(),
      line1: dir.line1 || "",
      city: dir.city || "",
      postalCode: dir.postalCode || "",
      country: dir.country || "ES",
    });
  };

  return (
    <div className="container-aurea py-16 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Finalizar compra</p>
        <h1 className="font-serif text-4xl mt-2">Checkout</h1>
        <div className="section-divider mx-auto" />
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-12">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  i < step ? "bg-aurea-600 text-cream" :
                  i === step ? "bg-ink text-cream" :
                  "bg-stone-200 text-stone-400"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] uppercase tracking-widest mt-1 ${i === step ? "text-ink" : "text-stone-400"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 sm:w-24 h-px mx-2 mb-5 ${i < step ? "bg-aurea-500" : "bg-stone-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Dirección */}
      {step === 0 && (
        <div className="max-w-xl mx-auto">
          {direccionesSaved.length > 0 && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">Direcciones guardadas</p>
              <div className="space-y-2">
                {direccionesSaved.map((dir) => (
                  <button
                    key={dir._id}
                    onClick={() => usarDireccionGuardada(dir)}
                    className={`w-full text-left p-4 border text-sm transition-colors ${
                      direccionSeleccionada === dir._id
                        ? "border-ink bg-stone-50"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <p className="font-medium text-ink">{dir.recipient}</p>
                    <p className="text-stone-500">{dir.line1}, {dir.city} {dir.postalCode}</p>
                  </button>
                ))}
              </div>
              <div className="section-divider" />
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">O introduce una nueva dirección</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">Destinatario</label>
              <input
                type="text"
                value={form.recipient}
                onChange={(e) => setField("recipient", e.target.value)}
                className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white"
                placeholder="Nombre completo"
              />
              {formErrors.recipient && <p className="text-red-500 text-xs mt-1">{formErrors.recipient}</p>}
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">Dirección</label>
              <input
                type="text"
                value={form.line1}
                onChange={(e) => setField("line1", e.target.value)}
                className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white"
                placeholder="Calle, número, piso..."
              />
              {formErrors.line1 && <p className="text-red-500 text-xs mt-1">{formErrors.line1}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white"
                  placeholder="Ciudad"
                />
                {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">Código postal</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white"
                  placeholder="28001"
                />
                {formErrors.postalCode && <p className="text-red-500 text-xs mt-1">{formErrors.postalCode}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">País</label>
              <select
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white"
              >
                <option value="ES">España</option>
                <option value="PT">Portugal</option>
                <option value="FR">Francia</option>
                <option value="DE">Alemania</option>
                <option value="IT">Italia</option>
                <option value="GB">Reino Unido</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link to="/tienda" className="btn-outline flex-1 text-center">Volver</Link>
            <button onClick={handleSiguientePaso} className="btn-primary flex-1">Continuar</button>
          </div>
        </div>
      )}

      {/* Step 1: Resumen */}
      {step === 1 && (
        <div className="max-w-xl mx-auto">
          {/* Dirección de envío */}
          <div className="mb-8 p-5 border border-stone-200">
            <div className="flex justify-between items-start">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Enviar a</p>
              <button onClick={() => setStep(0)} className="text-xs text-aurea-600 hover:underline">Cambiar</button>
            </div>
            <p className="text-sm font-medium text-ink">{form.recipient}</p>
            <p className="text-sm text-stone-600">{form.line1}, {form.city} {form.postalCode}, {form.country}</p>
          </div>

          {/* Items */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">Productos</p>
            <div className="space-y-3">
              {(carrito.items || []).map((item) => {
                const nombre = item.name || item.product?.name || "Producto";
                const precio = item.price || item.product?.price || 0;
                const img = item.image || item.product?.coverImage || "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&q=80";
                return (
                  <div key={item._id || item.productId} className="flex items-center gap-4">
                    <div className="w-14 h-16 bg-stone-100 flex-shrink-0">
                      <img src={img} alt={nombre} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-ink">{nombre}</p>
                      {item.variantSku && <p className="text-[10px] uppercase text-stone-400">{item.variantSku}</p>}
                    </div>
                    <p className="text-sm">{formatPrice(precio * (item.quantity || 1))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totales */}
          <div className="border-t border-stone-200 pt-4 space-y-2 text-sm mb-6">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span><span>{formatPrice(carrito.subtotal)}</span>
            </div>
            {carrito.discount > 0 && (
              <div className="flex justify-between text-aurea-700">
                <span>Descuento ({carrito.couponCode})</span><span>- {formatPrice(carrito.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Envío</span><span className="text-aurea-600">Gratis</span>
            </div>
            <div className="flex justify-between text-base font-medium text-ink border-t border-stone-200 pt-2">
              <span>Total</span><span>{formatPrice(carrito.estimatedTotal)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">Método de pago</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="border-2 border-ink p-4 text-sm flex flex-col items-center gap-2">
                <CardIcon />
                <span>Tarjeta</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Simulado</span>
              </button>
              <button className="border border-stone-200 p-4 text-sm flex flex-col items-center gap-2 opacity-50 cursor-not-allowed" disabled>
                <PaypalIcon />
                <span>PayPal</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">Próximamente</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-outline flex-1">Atrás</button>
            <button onClick={handleCrearPedido} disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="flex items-center gap-2 justify-center"><Spinner /> Procesando...</span> : "Confirmar pedido"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirmación */}
      {step === 2 && pedidoCreado && (
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-aurea-100 flex items-center justify-center mx-auto mb-6">
            <CheckIcon />
          </div>
          <p className="text-xs uppercase tracking-widest text-aurea-600 mb-2">Pedido confirmado</p>
          <h2 className="font-serif text-3xl text-ink">¡Gracias por tu compra!</h2>
          <div className="section-divider mx-auto" />
          <div className="bg-stone-50 border border-stone-200 p-6 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500 uppercase tracking-widest text-[10px]">Número de pedido</span>
              <span className="font-mono text-ink font-medium">{pedidoCreado.orderNumber || pedidoCreado._id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500 uppercase tracking-widest text-[10px]">Total</span>
              <span className="text-ink">{formatPrice(pedidoCreado.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500 uppercase tracking-widest text-[10px]">Estado</span>
              <span className="text-aurea-700 capitalize">{pedidoCreado.status || "procesando"}</span>
            </div>
          </div>
          <p className="text-stone-600 text-sm mb-8">
            Recibirás un email de confirmación. Los certificados blockchain se emitirán automáticamente
            y aparecerán en tu perfil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/mis-pedidos" className="btn-primary">Ver mis pedidos</Link>
            <Link to="/tienda" className="btn-outline">Seguir comprando</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
  );
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-aurea-600">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function PaypalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 11C7 11 6 18 6 19H9L10 13H14C16.2 13 18 11.2 18 9C18 7.3 16.8 6 15 6H8L7 11Z" />
    </svg>
  );
}
