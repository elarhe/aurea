import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { productosService, reseñasService, usuariosService } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";

function formatPrice(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0);
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { cliente } = useAuth();
  const { agregarItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [size, setSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reseñas
  const [reseñas, setReseñas] = useState([]);
  const [reseñasLoading, setReseñasLoading] = useState(false);
  const [nuevaReseña, setNuevaReseña] = useState({ rating: 5, comment: "" });
  const [enviandoReseña, setEnviandoReseña] = useState(false);
  const [reseñaEnviada, setReseñaEnviada] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    productosService
      .getBySlug(slug)
      .then((data) => {
        const p = data.product || data;
        setProduct(p);
        // Pre-seleccionar primera talla disponible
        const tallas = p.sizes || p.variants?.map((v) => v.size).filter(Boolean) || [];
        if (tallas.length > 0) setSize(tallas[0]);
      })
      .catch(() => setError("No se pudo cargar el producto."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Cargar reseñas
  useEffect(() => {
    if (!product) return;
    const productId = product._id;
    if (!productId) return;
    setReseñasLoading(true);
    reseñasService
      .getByProducto(productId)
      .then((data) => setReseñas(data.reviews || data || []))
      .catch(() => {})
      .finally(() => setReseñasLoading(false));
  }, [product]);

  // Verificar wishlist
  useEffect(() => {
    if (!cliente || !product) return;
    usuariosService
      .miWishlist()
      .then((data) => {
        const wishlist = data.wishlist || data || [];
        setInWishlist(wishlist.some((w) => (w._id || w) === product._id));
      })
      .catch(() => {});
  }, [cliente, product]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    setCartError(null);
    try {
      const variantSku = size || product.variants?.[0]?.sku || product.sku || "default";
      await agregarItem(product._id, variantSku, 1, {
        name: product.name,
        price: product.price,
        image: product.coverImage,
      });
    } catch (e) {
      setCartError(e.response?.data?.message || "No se pudo añadir al carrito.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!cliente) return;
    setWishlistLoading(true);
    try {
      await usuariosService.toggleWishlist(product._id);
      setInWishlist((v) => !v);
    } catch {
      // silencioso
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleEnviarReseña = async (e) => {
    e.preventDefault();
    if (!product?._id) return;
    setEnviandoReseña(true);
    try {
      const data = await reseñasService.crear(product._id, nuevaReseña);
      setReseñas((prev) => [data.review || data, ...prev]);
      setReseñaEnviada(true);
      setNuevaReseña({ rating: 5, comment: "" });
    } catch {
      // silencioso
    } finally {
      setEnviandoReseña(false);
    }
  };

  if (loading) {
    return (
      <div className="container-aurea py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-[3/4] bg-stone-100 animate-pulse" />
          <div className="lg:py-8 space-y-4">
            <div className="h-3 bg-stone-100 rounded animate-pulse w-16" />
            <div className="h-8 bg-stone-100 rounded animate-pulse w-2/3" />
            <div className="h-6 bg-stone-100 rounded animate-pulse w-1/4" />
            <div className="h-px bg-stone-100 my-6" />
            <div className="h-4 bg-stone-100 rounded animate-pulse" />
            <div className="h-4 bg-stone-100 rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-aurea py-12 text-center">
        <p className="font-serif text-2xl text-ink mb-4">{error || "Producto no encontrado"}</p>
        <Link to="/tienda" className="btn-primary">Volver a la tienda</Link>
      </div>
    );
  }

  const tallas = product.sizes || product.variants?.map((v) => v.size).filter(Boolean) || ["XS", "S", "M", "L", "XL"];
  const avgRating = reseñas.length > 0
    ? (reseñas.reduce((s, r) => s + (r.rating || 0), 0) / reseñas.length).toFixed(1)
    : null;

  return (
    <div className="container-aurea py-12">
      {/* Breadcrumb */}
      <nav className="text-xs uppercase tracking-widest text-stone-500 mb-8">
        <Link to="/" className="hover:text-ink">Inicio</Link>
        {" · "}
        <Link to="/tienda" className="hover:text-ink">Tienda</Link>
        {product.category && (
          <>
            {" · "}
            <Link to={`/tienda/${product.category}`} className="hover:text-ink capitalize">
              {product.category}
            </Link>
          </>
        )}
        {" · "}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Imagen */}
        <div className="aspect-[3/4] bg-stone-100 overflow-hidden">
          <img
            src={product.coverImage || "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="lg:py-8">
          <p className="text-xs uppercase tracking-widest text-aurea-600">{product.brand || "Aurea"}</p>
          <h1 className="font-serif text-4xl mt-2">{product.name}</h1>

          <div className="flex items-baseline gap-3 mt-4">
            <p className="text-2xl text-ink">{formatPrice(product.price)}</p>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="text-sm text-stone-400 line-through">{formatPrice(product.compareAtPrice)}</p>
            )}
          </div>

          {avgRating && (
            <div className="flex items-center gap-1.5 mt-2">
              <StarRating rating={parseFloat(avgRating)} />
              <span className="text-xs text-stone-500">({reseñas.length} reseñas)</span>
            </div>
          )}

          <div className="section-divider" />

          <p className="text-stone-600 leading-relaxed">
            {product.description ||
              `Una pieza atemporal confeccionada con materiales nobles. Cada ${product.name.toLowerCase()} incluye
              su certificado de autenticidad en blockchain, garantizando su origen y trazabilidad.`}
          </p>

          {/* Tallas */}
          {tallas.length > 0 && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-stone-600 mb-3">Talla</p>
              <div className="flex gap-2 flex-wrap">
                {tallas.map((s) => (
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
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {addingToCart ? (
                <>
                  <Spinner />
                  Añadiendo...
                </>
              ) : "Añadir al carrito"}
            </button>
            <button
              onClick={cliente ? handleToggleWishlist : undefined}
              disabled={wishlistLoading}
              className={`btn-outline flex items-center gap-1.5 ${!cliente ? "opacity-60" : ""}`}
              title={!cliente ? "Inicia sesión para guardar" : ""}
            >
              {inWishlist ? "♥ Guardado" : "♡ Guardar"}
            </button>
          </div>

          {cartError && <p className="text-red-500 text-xs mt-2">{cartError}</p>}

          {/* Certificación */}
          {product.certifiable !== false && (
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
          )}

          {/* Detalles */}
          <details className="mt-6 border-t border-stone-200 pt-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest">Composición y cuidados</summary>
            <p className="text-sm text-stone-600 mt-3">
              {product.materials || "100% materiales naturales. Lavar a mano en agua fría. Planchar a baja temperatura."}
            </p>
          </details>
          <details className="mt-2 border-t border-stone-200 pt-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest">Envío y devoluciones</summary>
            <p className="text-sm text-stone-600 mt-3">Envío gratuito en pedidos superiores a 100€. Devoluciones gratuitas durante 30 días.</p>
          </details>
        </div>
      </div>

      {/* Sección reseñas */}
      <div className="mt-20 pt-12 border-t border-stone-200">
        <h2 className="font-serif text-3xl mb-2">Reseñas</h2>
        <div className="section-divider" />

        {reseñasLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-stone-100 animate-pulse rounded" />
            ))}
          </div>
        )}

        {!reseñasLoading && reseñas.length === 0 && (
          <p className="text-stone-500 text-sm mb-8">Aún no hay reseñas para este producto.</p>
        )}

        {!reseñasLoading && reseñas.length > 0 && (
          <div className="space-y-6 mb-10">
            {reseñas.map((r, i) => (
              <div key={r._id || i} className="border-b border-stone-100 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <StarRating rating={r.rating || 0} />
                  <span className="text-xs text-stone-400">
                    {r.user?.firstName || r.user?.nombre || "Cliente"} ·{" "}
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-ES") : ""}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-stone-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Formulario reseña */}
        {cliente && !reseñaEnviada && (
          <div className="max-w-lg">
            <h3 className="font-serif text-xl mb-4">Deja tu reseña</h3>
            <form onSubmit={handleEnviarReseña} className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Valoración</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNuevaReseña((r) => ({ ...r, rating: star }))}
                      className={`text-2xl transition-colors ${star <= nuevaReseña.rating ? "text-aurea-500" : "text-stone-200"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">Comentario</label>
                <textarea
                  value={nuevaReseña.comment}
                  onChange={(e) => setNuevaReseña((r) => ({ ...r, comment: e.target.value }))}
                  rows={3}
                  className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white resize-none"
                  placeholder="Comparte tu experiencia con esta prenda..."
                />
              </div>
              <button type="submit" disabled={enviandoReseña} className="btn-primary">
                {enviandoReseña ? "Enviando..." : "Publicar reseña"}
              </button>
            </form>
          </div>
        )}

        {reseñaEnviada && (
          <p className="text-green-600 text-sm">¡Gracias por tu reseña! Ha sido publicada.</p>
        )}
      </div>

      {/* Productos relacionados */}
      {product.relatedProducts?.length > 0 && (
        <div className="mt-20 pt-12 border-t border-stone-200">
          <h2 className="font-serif text-3xl mb-2">También te puede gustar</h2>
          <div className="section-divider" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {product.relatedProducts.map((p) => (
              <ProductCard key={p.slug || p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-sm ${s <= Math.round(rating) ? "text-aurea-500" : "text-stone-200"}`}>★</span>
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />;
}
