import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { productosService, categoriasService } from "../services/api.js";

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function Catalog() {
  const { category } = useParams();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [genero, setGenero] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const LIMIT = 12;

  // Cargar categorías una vez
  useEffect(() => {
    categoriasService
      .getAll()
      .then((data) => setCategorias(data.categories || data || []))
      .catch(() => {});
  }, []);

  // Cargar productos cuando cambien los parámetros
  const fetchProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT, sort };
      if (category) params.category = category;
      if (priceMin) params.priceMin = priceMin;
      if (priceMax) params.priceMax = priceMax;
      if (genero) params.gender = genero;

      const data = await productosService.getAll(params);
      const list = data.products || data.data || data || [];
      setProductos(list);
      setTotal(data.total || list.length);
      setTotalPages(data.totalPages || Math.ceil((data.total || list.length) / LIMIT) || 1);
    } catch {
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  }, [category, sort, page, priceMin, priceMax, genero]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  // Resetear página al cambiar filtros o categoría
  useEffect(() => {
    setPage(1);
  }, [category, sort, priceMin, priceMax, genero]);

  const title = category ? capitalize(category) : "Toda la colección";

  const handleCategoryClick = (slug) => {
    navigate(slug ? `/tienda/${slug}` : "/tienda");
  };

  const clearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setGenero("");
    setSort("featured");
  };

  return (
    <div className="container-aurea py-16">
      {/* Cabecera */}
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Catálogo</p>
        <h1 className="font-serif text-5xl mt-2">{title}</h1>
        <div className="section-divider mx-auto" />
        <p className="text-stone-600 max-w-xl mx-auto">
          {loading ? "Cargando colección..." : `${total} ${total === 1 ? "pieza" : "piezas"} cuidadosamente seleccionadas, cada una con su certificado de autenticidad.`}
        </p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar filtros — desktop */}
        <aside className="hidden lg:block w-52 flex-shrink-0 space-y-8">
          {/* Categorías */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">Categoría</p>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => handleCategoryClick("")}
                  className={`text-sm transition-colors ${!category ? "text-ink font-medium" : "text-stone-500 hover:text-ink"}`}
                >
                  Todos
                </button>
              </li>
              {categorias.map((cat) => (
                <li key={cat._id || cat.slug}>
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className={`text-sm transition-colors ${category === cat.slug ? "text-ink font-medium" : "text-stone-500 hover:text-ink"}`}
                  >
                    {cat.name || capitalize(cat.slug)}
                  </button>
                </li>
              ))}
              {/* Fallback si no hay cats de API */}
              {categorias.length === 0 && ["mujer", "hombre", "accesorios"].map((c) => (
                <li key={c}>
                  <button
                    onClick={() => handleCategoryClick(c)}
                    className={`text-sm transition-colors ${category === c ? "text-ink font-medium" : "text-stone-500 hover:text-ink"}`}
                  >
                    {capitalize(c)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Precio */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">Precio</p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-stone-400 mb-1 block">Mínimo</label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={priceMin || 0}
                  onChange={(e) => setPriceMin(e.target.value === "0" ? "" : e.target.value)}
                  className="w-full accent-aurea-500"
                />
                <span className="text-xs text-stone-500">{priceMin ? `${priceMin}€` : "Sin mínimo"}</span>
              </div>
              <div>
                <label className="text-[10px] text-stone-400 mb-1 block">Máximo</label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={priceMax || 1000}
                  onChange={(e) => setPriceMax(e.target.value === "1000" ? "" : e.target.value)}
                  className="w-full accent-aurea-500"
                />
                <span className="text-xs text-stone-500">{priceMax ? `${priceMax}€` : "Sin máximo"}</span>
              </div>
            </div>
          </div>

          {/* Género */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">Género</p>
            <ul className="space-y-1.5">
              {[{ label: "Todos", val: "" }, { label: "Mujer", val: "mujer" }, { label: "Hombre", val: "hombre" }, { label: "Unisex", val: "unisex" }].map((g) => (
                <li key={g.val}>
                  <button
                    onClick={() => setGenero(g.val)}
                    className={`text-sm transition-colors ${genero === g.val ? "text-ink font-medium" : "text-stone-500 hover:text-ink"}`}
                  >
                    {g.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {(priceMin || priceMax || genero) && (
            <button onClick={clearFilters} className="text-xs text-stone-400 hover:text-ink underline">
              Limpiar filtros
            </button>
          )}
        </aside>

        {/* Contenido principal */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-8 pb-5 border-b border-stone-200 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden text-xs uppercase tracking-widest text-stone-500 hover:text-ink flex items-center gap-1.5"
              >
                <FilterIcon />
                Filtros
              </button>
              <p className="text-sm text-stone-600 hidden sm:block">{total} resultados</p>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs uppercase tracking-widest bg-transparent border border-stone-300 px-3 py-2 focus:outline-none focus:border-aurea-500"
            >
              <option value="featured">Destacados</option>
              <option value="newest">Más nuevos</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
            </select>
          </div>

          {/* Filtros mobile desplegables */}
          {filtersOpen && (
            <div className="lg:hidden mb-6 p-5 border border-stone-200 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-3">Precio</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min €"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-aurea-500"
                  />
                  <input
                    type="number"
                    placeholder="Max €"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-aurea-500"
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">Género</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ label: "Todos", val: "" }, { label: "Mujer", val: "mujer" }, { label: "Hombre", val: "hombre" }].map((g) => (
                    <button
                      key={g.val}
                      onClick={() => setGenero(g.val)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${genero === g.val ? "border-ink bg-ink text-cream" : "border-stone-300 text-stone-600 hover:border-ink"}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
              {Array.from({ length: LIMIT }).map((_, i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-stone-100 animate-pulse" />
                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-stone-100 rounded animate-pulse w-12" />
                    <div className="h-4 bg-stone-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-stone-100 rounded animate-pulse w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="text-center py-20">
              <p className="text-stone-500 mb-4">{error}</p>
              <button onClick={fetchProductos} className="btn-outline text-xs">Reintentar</button>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && !error && productos.length === 0 && (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-ink mb-2">Sin resultados</p>
              <p className="text-stone-500 text-sm mb-6">No hemos encontrado productos con estos filtros.</p>
              <button onClick={clearFilters} className="btn-outline text-xs">Limpiar filtros</button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && productos.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                {productos.map((p) => (
                  <ProductCard key={p.slug || p._id} product={p} />
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-14">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-outline text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-stone-500">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-outline text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
