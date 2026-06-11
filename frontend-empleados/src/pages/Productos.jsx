import { useState, useEffect, useCallback } from "react";
import { productosService, categoriasService, uploadService } from "../services/api";

const CATS_FALLBACK = ["Vestidos","Chaquetas","Pantalones","Tops","Abrigos","Faldas","Accesorios","Zapatos"];

const VACIO = { nombre: "", categoryId: "", precio: "", compareAtPrice: "", stock: "", descripcion: "", imagen: "", certifiable: false, materiales: "", traducciones: {} };

const stockColor = (stock) => {
  if (stock === 0) return "text-red-600 bg-red-50";
  if (stock <= 8) return "text-amber-600 bg-amber-50";
  return "text-green-700 bg-green-50";
};


const IDIOMAS = [
  { code: "en", label: "Inglés", flag: "🇬🇧" },
  { code: "fr", label: "Francés", flag: "🇫🇷" },
  { code: "de", label: "Alemán", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Portugués", flag: "🇵🇹" },
  { code: "uk", label: "Ucraniano", flag: "🇺🇦" },
  { code: "zh", label: "Chino", flag: "🇨🇳" },
  { code: "ja", label: "Japonés", flag: "🇯🇵" },
  { code: "ar", label: "Árabe", flag: "🇸🇦" },
  { code: "ru", label: "Ruso", flag: "🇷🇺" },
  { code: "ca", label: "Catalán", flag: "🏴" },
];

async function traducirTexto(texto, targetLang) {
  if (!texto.trim()) return "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=es|${targetLang}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.responseStatus === 200) return data.responseData.translatedText || "";
  throw new Error("Error de traducción");
}

function TraduccionesSection({ traducciones, onChange, nombreEs, descripcionEs }) {
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState("");
  const [traduciendo, setTraduciendo] = useState(null); // lang code being translated

  const idiomasDisponibles = IDIOMAS.filter((i) => !traducciones[i.code]);

  const agregarIdioma = async () => {
    if (!idiomaSeleccionado) return;
    const nuevo = { ...traducciones, [idiomaSeleccionado]: { name: "", description: "" } };
    onChange(nuevo);

    // Auto-translate
    setTraduciendo(idiomaSeleccionado);
    try {
      const [name, description] = await Promise.all([
        traducirTexto(nombreEs || "", idiomaSeleccionado),
        traducirTexto(descripcionEs || "", idiomaSeleccionado),
      ]);
      onChange({ ...nuevo, [idiomaSeleccionado]: { name, description } });
    } catch (e) {
      // Keep empty fields if translation fails
    } finally {
      setTraduciendo(null);
      setIdiomaSeleccionado("");
    }
  };

  const eliminarIdioma = (code) => {
    const updated = { ...traducciones };
    delete updated[code];
    onChange(updated);
  };

  const updateField = (code, field, value) => {
    onChange({ ...traducciones, [code]: { ...traducciones[code], [field]: value } });
  };

  return (
    <div className="col-span-2 border-t border-stone-100 pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Traducciones</p>
        <div className="flex items-center gap-2">
          <select
            value={idiomaSeleccionado}
            onChange={(e) => setIdiomaSeleccionado(e.target.value)}
            className="border border-stone-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:border-stone-400"
          >
            <option value="">Añadir idioma...</option>
            {idiomasDisponibles.map((i) => (
              <option key={i.code} value={i.code}>{i.flag} {i.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={agregarIdioma}
            disabled={!idiomaSeleccionado || !!traduciendo}
            className="px-3 py-1 text-xs bg-stone-800 text-white rounded-lg hover:bg-stone-600 disabled:opacity-40 transition-colors"
          >
            {traduciendo ? "Traduciendo..." : "+ Añadir"}
          </button>
        </div>
      </div>

      {Object.keys(traducciones).length === 0 && (
        <p className="text-xs text-stone-400 italic">Sin traducciones. Elige un idioma del desplegable para añadir.</p>
      )}

      {Object.entries(traducciones).map(([code, val]) => {
        const idioma = IDIOMAS.find((i) => i.code === code) || { flag: "🌐", label: code.toUpperCase() };
        const cargando = traduciendo === code;
        return (
          <div key={code} className="bg-stone-50 rounded-lg p-3 space-y-2 border border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600">{idioma.flag} {idioma.label}</span>
              <button type="button" onClick={() => eliminarIdioma(code)} className="text-stone-300 hover:text-red-400 text-sm transition-colors">✕</button>
            </div>
            {cargando ? (
              <div className="animate-pulse space-y-2">
                <div className="h-7 bg-stone-200 rounded" />
                <div className="h-12 bg-stone-200 rounded" />
              </div>
            ) : (
              <>
                <input
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-stone-400 bg-white"
                  value={val.name || ""}
                  onChange={(e) => updateField(code, "name", e.target.value)}
                  placeholder={`Nombre en ${idioma.label.toLowerCase()}`}
                />
                <textarea
                  rows={2}
                  className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-stone-400 resize-none bg-white"
                  value={val.description || ""}
                  onChange={(e) => updateField(code, "description", e.target.value)}
                  placeholder={`Descripción en ${idioma.label.toLowerCase()}`}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Modal({ titulo, form, onChange, onGuardar, onCerrar, guardando, categorias }) {
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setErrorSubida(null);
    try {
      const res = await uploadService.imagen(file);
      onChange("imagen", res.data.url);
    } catch (err) {
      setErrorSubida(err.response?.data?.mensaje || "Error al subir imagen");
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  };

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
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Imagen del producto</label>
            <div className="flex gap-2 items-start flex-wrap">
              <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${subiendo ? "bg-stone-100 text-stone-400 cursor-not-allowed" : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={subiendo} />
                {subiendo ? "⏳ Subiendo..." : "📎 Subir archivo"}
              </label>
              <input
                className="flex-1 min-w-0 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
                value={form.imagen}
                onChange={(e) => onChange("imagen", e.target.value)}
                placeholder="o pega una URL aquí..."
              />
            </div>
            {errorSubida && <p className="text-xs text-red-500 mt-1">{errorSubida}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Materiales (separados por coma)</label>
            <input className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400" value={form.materiales} onChange={(e) => onChange("materiales", e.target.value)} placeholder="Algodón orgánico, Lino..." />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Descripción</label>
            <textarea rows={3} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none" value={form.descripcion} onChange={(e) => onChange("descripcion", e.target.value)} placeholder="Descripción del producto..." />
          </div>
          <TraduccionesSection traducciones={form.traducciones || {}} onChange={(t) => onChange("traducciones", t)} nombreEs={form.nombre} descripcionEs={form.descripcion} />
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
function ModalStock({ producto, onCerrar, onGuardar }) {
  const tieneVariantes = producto.variants && producto.variants.length > 0;
  const [stockSimple, setStockSimple] = useState(producto.stock ?? 0);
  const [ajustes, setAjustes] = useState(
    tieneVariantes
      ? producto.variants.map((v) => ({ sku: v.sku, size: v.size || "—", color: v.color || "—", stock: v.stock ?? 0 }))
      : []
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const handleGuardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      const id = producto._id || producto.id;
      if (tieneVariantes) {
        await onGuardar(id, { ajustes: ajustes.map(({ sku, stock }) => ({ sku, stock: Number(stock) })) });
      } else {
        await onGuardar(id, { stock: Number(stockSimple) });
      }
      onCerrar();
    } catch (e) {
      setError(e.response?.data?.mensaje || "Error al guardar stock");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-800">Gestionar stock</h3>
            <p className="text-xs text-stone-400 mt-0.5">{producto.name || producto.nombre}</p>
          </div>
          <button onClick={onCerrar} className="text-stone-400 hover:text-stone-700 text-xl">✕</button>
        </div>
        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {tieneVariantes ? (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Variantes ({ajustes.length})</p>
            <div className="space-y-2">
              {ajustes.map((v, i) => (
                <div key={v.sku} className="flex items-center gap-3 bg-stone-50 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">
                      {v.size !== "—" && <span className="mr-2">T: {v.size}</span>}
                      {v.color !== "—" && <span className="text-stone-500">{v.color}</span>}
                    </p>
                    <p className="text-xs text-stone-400">{v.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAjustes((prev) => prev.map((a, j) => j === i ? { ...a, stock: Math.max(0, a.stock - 1) } : a))}
                      className="w-7 h-7 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 text-sm font-bold flex items-center justify-center">
                      −
                    </button>
                    <input
                      type="number" min="0"
                      value={v.stock}
                      onChange={(e) => setAjustes((prev) => prev.map((a, j) => j === i ? { ...a, stock: Math.max(0, Number(e.target.value)) } : a))}
                      className="w-16 text-center border border-stone-200 rounded-lg py-1 text-sm font-semibold focus:outline-none focus:border-stone-400"
                    />
                    <button
                      onClick={() => setAjustes((prev) => prev.map((a, j) => j === i ? { ...a, stock: a.stock + 1 } : a))}
                      className="w-7 h-7 rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 text-sm font-bold flex items-center justify-center">
                      +
                    </button>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${stockColor(v.stock)}`}>
                    {v.stock === 0 ? "Agotado" : `${v.stock} uds`}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Stock total: <span className="font-semibold text-stone-600">{ajustes.reduce((s, v) => s + v.stock, 0)} uds</span>
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-stone-500 mb-2">Este producto no tiene variantes. Edita el stock directamente:</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStockSimple((s) => Math.max(0, s - 1))}
                className="w-9 h-9 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 text-lg font-bold flex items-center justify-center">
                −
              </button>
              <input
                type="number" min="0"
                value={stockSimple}
                onChange={(e) => setStockSimple(Math.max(0, Number(e.target.value)))}
                className="w-24 text-center border border-stone-200 rounded-lg py-2 text-xl font-bold focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={() => setStockSimple((s) => s + 1)}
                className="w-9 h-9 rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 text-lg font-bold flex items-center justify-center">
                +
              </button>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${stockColor(stockSimple)}`}>
                {stockSimple === 0 ? "Sin stock" : `${stockSimple} unidades`}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
          <button onClick={onCerrar} className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">Cancelar</button>
          <button onClick={handleGuardar} disabled={guardando} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50">
            {guardando ? "Guardando..." : "✓ Guardar stock"}
          </button>
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
  const [modalStock, setModalStock] = useState(null); // producto a gestionar stock
  const [cargando, setCargando] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [pagina, setPagina] = useState(1);
  const LIMITE = 10;

  useEffect(() => { setPagina(1); }, [busqueda, filtroCat]);

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
      const params = { page: pagina, limit: LIMITE };
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
  }, [busqueda, filtroCat, pagina]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  const onChange = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const abrirCrear = () => { setForm({ ...VACIO, categoryId: categorias[0]?._id || "" }); setProductoEditar(null); setModal("crear"); };

  const abrirEditar = (p) => {
    const cat = p.category || p.categoria;
    const categoryId = typeof cat === "object" ? cat._id : cat;
    // Build traducciones from new translations map + legacy name_en/name_uk fields
    const traducciones = {};
    if (p.translations && typeof p.translations === "object") {
      Object.entries(p.translations).forEach(([lang, val]) => {
        if (val) traducciones[lang] = { name: val.name || "", description: val.description || "" };
      });
    }
    if (p.name_en && !traducciones.en) traducciones.en = { name: p.name_en || "", description: p.description_en || "" };
    if (p.name_uk && !traducciones.uk) traducciones.uk = { name: p.name_uk || "", description: p.description_uk || "" };
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
      traducciones,
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
        translations: form.traducciones || {},
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

  const guardarStock = async (id, data) => {
    const res = await productosService.actualizarStock(id, data);
    const updated = res.data?.producto || res.data;
    setProductos((prev) => prev.map((p) => (p._id || p.id) === id ? updated : p));
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
      {modalStock && <ModalStock producto={modalStock} onCerrar={() => setModalStock(null)} onGuardar={guardarStock} />}
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
                      <button onClick={() => setModalStock(p)} className="text-xs text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md hover:bg-amber-50 transition-colors">Stock</button>
                      <button onClick={() => setConfirmarEliminar(p)} className="text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(() => {
        const totalPaginas = Math.ceil(total / LIMITE);
        if (totalPaginas <= 1) return null;
        const nums = [...new Set([1, totalPaginas, pagina, pagina - 1, pagina - 2, pagina + 1, pagina + 2])]
          .filter((n) => n >= 1 && n <= totalPaginas)
          .sort((a, b) => a - b);
        const items = [];
        nums.forEach((n, i) => {
          if (i > 0 && n - nums[i - 1] > 1) items.push(<span key={`e${i}`} className="text-xs px-1 text-stone-400 self-center">…</span>);
          items.push(
            <button key={n} onClick={() => setPagina(n)}
              className={`text-xs w-8 h-7 rounded-lg border transition-colors ${pagina === n ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>
              {n}
            </button>
          );
        });
        return (
          <div className="flex items-center justify-center gap-1 py-4 border-t border-stone-100">
            <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors">
              ←
            </button>
            {items}
            <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
              className="text-xs px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-40 transition-colors">
              →
            </button>
          </div>
        );
      })()}
    </div>
  );
}