import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { mockProducts } from "../data/mockProducts.js";

export default function Catalog() {
  const { category } = useParams();
  const [sort, setSort] = useState("featured");

  const products = useMemo(() => {
    let list = mockProducts;
    if (category) list = list.filter((p) => p.category === category);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [category, sort]);

  const title = category ? capitalize(category) : "Toda la colección";

  return (
    <div className="container-aurea py-16">
      {/* Cabecera */}
      <div className="text-center mb-12">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Catálogo</p>
        <h1 className="font-serif text-5xl mt-2">{title}</h1>
        <div className="section-divider mx-auto" />
        <p className="text-stone-600 max-w-xl mx-auto">
          {products.length} {products.length === 1 ? "pieza" : "piezas"} cuidadosamente seleccionadas,
          cada una con su certificado de autenticidad.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-stone-200">
        <p className="text-sm text-stone-600">{products.length} resultados</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs uppercase tracking-widest bg-transparent border border-stone-300 px-3 py-2 focus:outline-none focus:border-aurea-500"
        >
          <option value="featured">Destacados</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <p className="text-center text-stone-500 py-20 font-serif text-xl">
          No hay productos en esta categoría todavía.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
