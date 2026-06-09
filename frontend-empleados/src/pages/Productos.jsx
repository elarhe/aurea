import { useState, useEffect, useCallback } from "react";
import { productosService, categoriasService } from "../services/api";

const CATS_FALLBACK = ["Vestidos","Chaquetas","Pantalones","Tops","Abrigos","Faldas","Accesorios","Zapatos"];

const VACIO = { nombre: "", categoryId: "", precio: "", compareAtPrice: "", stock: "", descripcion: "", imagen: "", certifiable: false, materiales: "", name_en: "", name_uk: "", description_en: "", description_uk: "" };

const stockColor = (stock) => {
  if (stock === 0) return "text-red-600 bg-red-50";
  if (stock <= 8) return "text-amber-600 bg-amber-50";
  return "text-green-700 bg-green-50";
};

function Modal({ titulo, form, onChange, onGuardar, onCerrar, guardando, categorias }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800">{titulo}</h3>
          <button onClick={onCerrar} className="text-stone-400 hover:text-stone-700 text-xl">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Nombre *</label>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.nombre} onChange={(e) => onChange("nombre", e.target.value)} placeholder="Nombre del producto" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Categoría *</label>
            <select className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white" value={form.categoryId} onChange={(e) => onChange("categoryId", e.target.value)}>
              <option value="">Selecciona categoría</option>
              {categorias.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Precio (€) *</label>
            <input type="number" min="0" step="0.01" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.precio} onChange={(e) => onChange("precio", e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Precio rebajado (€)</label>
            <input type="number" min="0" step="0.01" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.compareAtPrice} onChange={(e) => onChange("compareAtPrice", e.target.value)} placeholder="Precio tachado opcional" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Stock *</label>
            <input type="number" min="0" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.stock} onChange={(e) => onChange("stock", e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">URL imagen</label>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.imagen} onChange={(e) => onChange("imagen", e.target.value)} placeholder="https://..." />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Materiales (separados por coma)</label>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.materiales} onChange={(e) => onChange("materiales", e.target.value)} placeholder="Algodón orgánico, Lino..." />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Descripción</label>
            <textarea rows={3} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none" value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} placeholder="Descripción del producto..." />
          </div>
          <div className="col-span-2 border-t border-stone-100 pt-3">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Traducciones (opcional)</p>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Nombre en inglés</label>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.name_en} onChange={(e) => onChange("name_en", e.target.value)} placeholder="Name in English" />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Nombre en ucraniano</label>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.name_uk} onChange={(e) => onChange("name_uk", e.target.value)} placeholder="Назва українською" />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Descripción en inglés</label>
            <textarea rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none" value={form.description_en} onChange={(e) => onChange("description_en", e.target.value)} placeholder="Description in English..." />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Descripción en ucraniano</label>
            <textarea rows={2} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none" value={form.description_uk} onChange={(e) => onChange("description_uk", e.target.value)} placeholder="Опис українською..." />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.certifiable} onChange={(e) => onChange("certifiable", e.target.checked)} className="w-4 h-4 rounded border-stone-300 accent-stone-800" />
              <span className="text-sm text-stone-700">Certificable (blockchain)</span>
            </label>
          </div>
        </div>
        {form.imagen && (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <img src={form.imagen} alt="preview" className="w-12 h-12 rounded object-cover" onError={(e) => (e.target.style.display = "none")} />
            <span className="text-xs text-stone-400">Vista previa</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCerrar} className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">Cancelar</button>
          <button onClick={onGuardar} disabled={guardando} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50">{guardando ? "Guardando..." : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function ModalEliminar({ producto, onConfirmar, onCerrar, eliminando }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <h3 className="text-lg font-bold text-stone-800">Eliminar producto</h3>
        <p className="text-sm text-stone-600">¿Seguro que quieres eliminar <span className="font-semibold">"{producto.name || producto.nombre}"</span>?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCerrar} className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50">Cancelar</button>
          <button onClick={onConfirmar} disabled={eliminando} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">{eliminando ? "Eliminando..." : "Eliminar"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [productoEditar, setProductoEditar] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  useEffect(() => {
    categoriasService.getAll()
      .then((res) => {
        const data = res.data;
        const cats = data.categorias || data.categories || data.data || [];
        const planas = [];
        cats.forEach((c) => { planas.push(c); if (c.children?.length) c.children.forEach((ch) => planas.push(ch)); });
        setCategorias(planas.length > 0 ? planas : CATS_FALLBACK.map((n) => ({ _id: n, name: n })));
      })
      .catch(() => setCategorias(CATS_FALLBACK.map((n) => ({ _id: n, name: n }))));
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorBanner(null);
    try {
      const params = { page: 1, limit: 100 };
      if (busqueda.trim()) params.q = busqueda.trim();
      if (filtroCat !== "todas") params.category = filtroCat;
      const res = await productosService.getAll(params);
      const resData = res.data;
      setProductos(resData.productos || resData.products || resData.data || []);
      setTotal(resData.total || resData.count || 0);
    } catch (e) {
      setErrorBanner(e.response?.data?.message || "Error al cargar productos");
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroCat]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  const onChange = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const abrirCrear = () => { setForm({ ...VACIO, categoryId: categorias[0]?._id || "" }); setProductoEditar(null); setModal("crear"); };

  const abrirEditar = (p) => {
    const cat = p.category || p.categoria;
    const categoryId = typeof cat === "object" ? cat._id : cat;
    setForm({
      nombre: p.name || p.nombre || "",
      categoryId: categoryId || categorias[0]?._id || "",
      precio: p.price || p.precio || "",
      compareAtPrice: p.compareAtPrice || "",
      stock: p.stock ?? "",
      descripcion: p.description || p.descripcion || "",
      imagen: p.coverImage || p.imagen || p.image || "",
      certifiable: p.certifiable || false,
      materiales: Array.isArray(p.materials || p.materiales) ? (p.materials || p.materiales).join(", ") : (p.materials || p.materiales || ""),
      name_en: p.name_en || "",
      name_uk: p.name_uk || "",
      description_en: p.description_en || "",
      description_uk: p.description_uk || "",
    });
    setProductoEditar(p);
    setModal("editar");
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.precio || form.stock === "") return;
    setGuardando(true);
    setErrorBanner(null);
    try {
      const payload = {
        name: form.nombre.trim(),
        category: form.categoryId,
        price: parseFloat(form.precio),
        ...(form.compareAtPrice ? { compareAtPrice: parseFloat(form.compareAtPrice) } : {}),
        stock: parseInt(form.stock),
        description: form.descripcion.trim(),
        coverImage: form.imagen.trim() || "",
        certifiable: form.certifiable,
        materials: form.materiales ? form.materiales.split(",").map((m) => m.trim()).filter(Boolean) : [],
        ...(form.name_en.trim() ? { name_en: form.name_en.trim() } : {}),
        ...(form.name_uk.trim() ? { name_uk: form.name_uk.trim() } : {}),
        ...(form.description_en.trim() ? { description_en: form.description_en.trim() } : {}),
        ...(form.description_uk.trim() ? { description_uk: form.description_uk.trim() } : {}),
      };
      if (modal === "crear") {
        const res = await productosService.crear(payload);
        const nuevo = res.data?.producto || res.data?.product || res.data;
        setProductos((prev) => [nuevo, ...prev]);
        setTotal((t) => t + 1);
      } else {
        const id = productoEditar._id || productoEditar.id;
        const res = await productosService.editar(id, payload);
        const updated = res.data?.producto || res.data?.product || res.data;
        setProductos((prev) => prev.map((p) => (p._id || p.id) === id ? updated : p));
      }
      setModal(null);
    } catch (e) {
      setErrorBanner(e.response?.data?.message || e.response?.data?.error || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    if (!confirmarEliminar) return;
    setEliminando(true);
    try {
      const id = confirmarEliminar._id || confirmarEliminar.id;
      await productosService.eliminar(id);
      setProductos((prev) => prev.filter((p) => (p._id || p.id) !== id));
      setTotal((t) => Math.max(0, t - 1));
      setConfirmarEliminar(null);
    } catch (e) {
      setErrorBanner(e.response?.data?.message || "Error al eliminar");
      setConfirmarEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  const getNombreCategoria = (p) => {
    const cat = p.category || p.categoria;
    if (!cat) return "—";
    if (typeof cat === "object") return cat.name || "—";
    const found = categorias.find((c) => c._id === cat);
    return found ? found.name : cat;
  };

  return (
    <div className="p-8 space-y-6">
      {modal && <Modal titulo={modal === "crear" ? "Nuevo producto" : "Editar producto"} form={form} onChange={onChange} onGuardar={guardar} onCerrar={() => setModal(null)} guardando={guardando} categorias={categorias} />}
      {confirmarEliminar && <ModalEliminar producto={confirmarEliminar} onConfirmar={eliminar} onCerrar={() => setConfirmarEliminar(null)} eliminando={eliminando} />}
      {errorBanner && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{errorBanner}</p>
          <button onClick={() => setErrorBanner(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Productos</h2>
          <p className="text-stone-500 text-sm mt-1">{total} productos en catálogo</p>
        </div>
        <button onClick={abrirCrear} className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors">+ Añadir producto</button>
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-stone-400 w-56" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFiltroCat("todas")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filtroCat === "todas" ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}>Todas</button>
          {categorias.map((c) => (
            <button key={c._id} onClick={() => setFiltroCat(c._id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filtroCat === c._id ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}>{c.name}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>{["Producto","Categoría","Precio","Stock","Descripción","Acciones"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>
            {cargando ? [1,2,3,4].map((i) => (
              <tr key={i} className="border-b border-stone-100 animate-pulse">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-stone-100 rounded-lg"/><div className="h-3 bg-stone-100 rounded w-32"/></div></td>
                <td className="px-4 py-3"><div className="h-4 bg-stone-100 rounded-full w-20"/></td>
                <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-12"/></td>
                <td className="px-4 py-3"><div className="h-4 bg-stone-100 rounded-full w-16"/></td>
                <td className="px-4 py-3"><div className="h-3 bg-stone-100 rounded w-40"/></td>
                <td className="px-4 py-3"><div className="h-6 bg-stone-100 rounded w-24"/></td>
              </tr>
            )) : productos.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-stone-400 text-sm">No se encontraron productos</td></tr>
            ) : productos.map((p) => {
              const id = p._id || p.id;
              const nombre = p.name || p.nombre;
              const precio = p.price || p.precio || 0;
              const imagen = p.coverImage || p.imagen || p.image;
              const descripcion = p.description || p.descripcion;
              return (
                <tr key={id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {imagen ? <img src={imagen} alt={nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400 text-sm flex-shrink-0">{(nombre||"?")[0]}</div>}
                      <div><p className="font-medium text-stone-800">{nombre}</p>{p.certifiable && <span className="text-xs text-stone-400">🛡 certificable</span>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{getNombreCategoria(p)}</span></td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-700">{precio.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}</p>
                    {p.compareAtPrice && <p className="text-xs text-stone-400 line-through">{p.compareAtPrice.toLocaleString("es-ES",{style:"currency",currency:"EUR"})}</p>}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stockColor(p.stock??0)}`}>{(p.stock??0)===0?"Sin stock":`${p.stock} uds`}</span></td>
                  <td className="px-4 py-3 text-stone-500 text-xs max-w-xs truncate">{descripcion||"—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirEditar(p)} className="text-xs text-stone-600 border border-stone-200 px-2.5 py-1 rounded-md hover:bg-stone-100 transition-colors">Editar</button>
                      <button onClick={() => setConfirmarEliminar(p)} className="text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}