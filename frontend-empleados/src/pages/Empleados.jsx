import { useState, useEffect, useCallback } from "react";
import { empleadosService } from "../services/api";

const rolBadge = {
  admin: "bg-amber-100 text-amber-700",
  empleado: "bg-stone-100 text-stone-600",
};

const estadoBadge = {
  activo: "bg-green-100 text-green-700",
  inactivo: "bg-red-100 text-red-600",
  true: "bg-green-100 text-green-700",
  false: "bg-red-100 text-red-600",
};

const FORM_VACIO = { nombre: "", email: "", password: "", role: "empleado" };

function ModalCrear({ form, onChange, onGuardar, onCerrar, guardando, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-800">Añadir empleado</h3>
          <button onClick={onCerrar} className="text-stone-400 hover:text-stone-700 text-xl leading-none">✕</button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Nombre completo *</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.nombre}
              onChange={(e) => onChange("nombre", e.target.value)}
              placeholder="Nombre del empleado"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Email *</label>
            <input
              type="email"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="correo@aurea.com"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Contraseña *</label>
            <input
              type="password"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Rol</label>
            <select
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-stone-400 bg-white"
              value={form.role}
              onChange={(e) => onChange("role", e.target.value)}
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCerrar} className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onGuardar} disabled={guardando} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50">
            {guardando ? "Creando..." : "Crear empleado"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [toggling, setToggling] = useState({});

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await empleadosService.getAll();
      const resData = res.data;
      setEmpleados(resData.employees || resData.data || resData || []);
    } catch (e) {
      setError(e.response?.data?.message || "Error al cargar empleados");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const onChange = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  const crearEmpleado = async () => {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) return;
    setGuardando(true);
    setErrorModal(null);
    try {
      const res = await empleadosService.crear({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      const nuevoEmpleado = res.data?.empleado || res.data;
      setEmpleados((prev) => [...prev, nuevoEmpleado]);
      setModalCrear(false);
      setForm(FORM_VACIO);
    } catch (e) {
      setErrorModal(e.response?.data?.message || "Error al crear el empleado");
    } finally {
      setGuardando(false);
    }
  };

  const toggleEstado = async (id) => {
    setToggling((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await empleadosService.toggleEstado(id);
      const updated = res.data?.empleado || res.data;
      setEmpleados((prev) =>
        prev.map((e) => {
          const eid = e._id || e.id;
          if (eid !== id) return e;
          if (updated && (updated._id || updated.id)) return updated;
          const currentActive = e.activo ?? (e.estado === "activo");
          return { ...e, activo: !currentActive, estado: currentActive ? "inactivo" : "activo" };
        })
      );
    } catch (e) {
      alert(e.response?.data?.message || "Error al cambiar estado");
    } finally {
      setToggling((prev) => ({ ...prev, [id]: false }));
    }
  };

  const initials = (nombre) =>
    (nombre || "?").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const avatarColor = (rol) =>
    (rol === "admin" || rol === "superadmin") ? "bg-amber-500 text-stone-900" : "bg-stone-200 text-stone-700";

  const esActivo = (e) => {
    if (typeof e.activo === "boolean") return e.activo;
    return e.estado === "activo";
  };

  return (
    <div className="p-8 space-y-6">
      {modalCrear && (
        <ModalCrear
          form={form}
          onChange={onChange}
          onGuardar={crearEmpleado}
          onCerrar={() => { setModalCrear(false); setForm(FORM_VACIO); setErrorModal(null); }}
          guardando={guardando}
          error={errorModal}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Empleados</h2>
          <p className="text-stone-500 text-sm mt-1">{empleados.length} integrantes del equipo</p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
        >
          + Añadir empleado
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={cargar} className="text-xs text-red-700 font-medium hover:underline">Reintentar</button>
        </div>
      )}

      {cargando ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-stone-100"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-stone-100 rounded w-32"></div>
                  <div className="h-2.5 bg-stone-100 rounded w-24"></div>
                </div>
              </div>
              <div className="h-8 bg-stone-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {empleados.map((e) => {
            const id = e._id || e.id;
            const activo = esActivo(e);
            const rol = e.role || e.rol || "empleado";
            const estadoLabel = activo ? "activo" : "inactivo";
            const fechaAlta = e.createdAt
              ? new Date(e.createdAt).toLocaleDateString("es-ES")
              : e.fechaAlta || "—";

            return (
              <div key={id} className="bg-white rounded-xl border border-stone-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(rol)}`}>
                      {initials(e.nombre || e.name || e.email)}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-800">{e.nombre || e.name || "—"}</p>
                      <p className="text-stone-400 text-xs">{e.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolBadge[rol] || "bg-stone-100 text-stone-600"}`}>
                      {rol}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[estadoLabel]}`}>
                      {estadoLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <p className="text-xs text-stone-400">Alta: {fechaAlta}</p>
                  <button
                    onClick={() => toggleEstado(id)}
                    disabled={toggling[id]}
                    className={`text-xs px-3 py-1 rounded-md font-medium transition-all disabled:opacity-50
                      ${activo
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                  >
                    {toggling[id] ? "..." : activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
