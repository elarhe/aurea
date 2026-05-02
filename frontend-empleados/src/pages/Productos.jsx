import { useState } from "react";
import { productos as productosIniciales, categorias } from "../data/mockData";

// -------------------------------------------------------------------
// Cuando conectes la API real, solo cambia estas funciones:
//   - fetchProductos()   → GET    /api/v1/productos
//   - crearProducto()    → POST   /api/v1/productos
//   - editarProducto()   → PUT    /api/v1/productos/:id
//   - eliminarProducto() → DELETE /api/v1/productos/:id
// El resto del componente no cambia.
// -------------------------------------------------------------------

const VACIO = { nombre: "", categoria: categorias[0], precio: "", stock: "", descripcion: "", imagen: "" };

const stockColor = (stock) => {
  if (stock === 0) return "text-red-600 bg-red-50";
  if (stock <= 8) return "text-amber-600 bg-amber-50";
  return "text-green-700 bg-green-50";
};

function Modal({ titulo, form, onChange, onGuardar, onCerrar, guardando }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800">{titulo}</h3>
          <button onClick={onCerrar} className="text-stone-400 hover:text-stone-700 text-xl leading-none">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Nombre *</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.nombre}
              onChange={e => onChange("nombre", e.target.value)}
              placeholder="Nombre del producto"
            />
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">Categoría *</label>
            <select
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
              value={form.categoria}
              onChange={e => onChange("categoria", e.target.value)}
            >
              {categorias.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">Precio (€) *</label>
            <input
              type="number" min="0" step="0.01"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.precio}
              onChange={e => onChange("precio", e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">Stock *</label>
            <input
              type="number" min="0"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.stock}
              onChange={e => onChange("stock", e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-xs text-stone-500 mb-1 block">URL imagen</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.imagen}
              onChange={e => onChange("imagen", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="col-span-2">
            <label className="text-xs text-stone-500 mb-1 block">Descripción</label>
            <textarea
              rows={3}
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 resize-none"
              value={form.descripcion}
              onChange={e => onChange("descripcion", e.target.value)}
              placeholder="Descripción del producto..."
            />
          </div>
        </div>

        {form.imagen && (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <img src={form.imagen} alt="preview" className="w-12 h-12 rounded object-cover" onError={e => e.target.style.display="none"} />
            <span className="text-xs text-stone-400">Vista previa de imagen</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCerrar} className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onGuardar} disabled={guardando} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50">
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalEliminar({ producto, onConfirmar, onCerrar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <h3 className="text-lg font-bold text-stone-800">Eliminar producto</h3>
        <p className="text-sm text-stone-600">
          ¿Seguro que quieres eliminar <span className="font-semibold">"{producto.nombre}"</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onCerrar} className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirmar} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Productos() {
  const [productos, setProductos] = useState(productosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [productoEditar, setProductoEditar] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const filtrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = filtroCat === "todas" || p.categoria === filtroCat;
    return coincideBusqueda && coincideCategoria;
  });

  const onChange = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  const abrirCrear = () => {
    setForm(VACIO);
    setProductoEditar(null);
    setModal("crear");
  };

  const abrirEditar = (p) => {
    setForm({ nombre: p.nombre, categoria: p.categoria, precio: p.precio, stock: p.stock, descripcion: p.descripcion || "", imagen: p.imagen || "" });
    setProductoEditar(p);
    setModal("editar");
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.precio || form.stock === "") return;
    setGuardando(true);

    // TODO: reemplazar con llamada API real
    // if (modal === "crear") await axios.post("/api/v1/productos", payload);
    // if (modal === "editar") await axios.put(`/api/v1/productos/${productoEditar.id}`, payload);

    await new Promise(r => setTimeout(r, 300));

    const payload = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock),
      descripcion: form.descripcion.trim(),
      imagen: form.imagen.trim() || `https://placehold.co/60x60/e8dcc8/7a6548?text=${form.nombre[0]}`,
    };

    if (modal === "crear") {
      setProductos(prev => [...prev, { id: Date.now(), ...payload }]);
    } else {
      setProductos(prev => prev.map(p => p.id === productoEditar.id ? { ...p, ...payload } : p));
    }

    setGuardando(false);
    setModal(null);
  };

  const eliminar = (id) => {
    // TODO: reemplazar con → await axios.delete(`/api/v1/productos/${id}`);
    setProductos(prev => prev.filter(p => p.id !== id));
    setConfirmarEliminar(null);
  };

  return (
    <div className="p-8 space-y-6">
      {modal && (
        <Modal
          titulo={modal === "crear" ? "Nuevo producto" : "Editar producto"}
          form={form} onChange={onChange} onGuardar={guardar}
          onCerrar={() => setModal(null)} guardando={guardando}
        />
      )}
      {confirmarEliminar && (
        <ModalEliminar
          producto={confirmarEliminar}
          onConfirmar={() => eliminar(confirmarEliminar.id)}
          onCerrar={() => setConfirmarEliminar(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Productos</h2>
          <p className="text-stone-500 text-sm mt-1">{productos.length} productos en catálogo</p>
        </div>
        <button onClick={abrirCrear} className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors">
          + Añadir producto
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          type="text" placeholder="Buscar producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="border border-stone-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-stone-400 w-56"
        />
        <div className="flex gap-2 flex-wrap">
          {["todas", ...categorias].map(c => (
            <button key={c} onClick={() => setFiltroCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filtroCat === c ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              {["Producto", "Categoría", "Precio", "Stock", "Descripción", "Acciones"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-stone-400 text-sm">No se encontraron productos</td></tr>
            )}
            {filtrados.map(p => (
              <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <p className="font-medium text-stone-800">{p.nombre}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{p.categoria}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-stone-700">
                  {p.precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stockColor(p.stock)}`}>
                    {p.stock === 0 ? "Sin stock" : `${p.stock} uds`}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500 text-xs max-w-xs truncate">{p.descripcion || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => abrirEditar(p)}
                      className="text-xs text-stone-600 border border-stone-200 px-2.5 py-1 rounded-md hover:bg-stone-100 transition-colors">
                      Editar
                    </button>
                    <button onClick={() => setConfirmarEliminar(p)}
                      className="text-xs text-red-600 border border-red-200 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}