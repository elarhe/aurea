import { useState } from "react";
import { empleados as empleadosIniciales } from "../data/mockData";

const rolBadge = {
  admin: "bg-amber-100 text-amber-700",
  empleado: "bg-stone-100 text-stone-600",
};

const estadoBadge = {
  activo: "bg-green-100 text-green-700",
  inactivo: "bg-red-100 text-red-600",
};

export default function Empleados() {
  const [empleados, setEmpleados] = useState(empleadosIniciales);

  const toggleEstado = (id) => {
    setEmpleados((prev) =>
      prev.map((e) => e.id === id ? { ...e, estado: e.estado === "activo" ? "inactivo" : "activo" } : e)
    );
  };

  const initials = (nombre) =>
    nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const avatarColor = (rol) =>
    rol === "admin" ? "bg-amber-500 text-stone-900" : "bg-stone-200 text-stone-700";

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Empleados</h2>
          <p className="text-stone-500 text-sm mt-1">{empleados.length} integrantes del equipo</p>
        </div>
        <button className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors">
          + Añadir empleado
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {empleados.map((e) => (
          <div key={e.id} className="bg-white rounded-xl border border-stone-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor(e.rol)}`}>
                  {initials(e.nombre)}
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{e.nombre}</p>
                  <p className="text-stone-400 text-xs">{e.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rolBadge[e.rol]}`}>{e.rol}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge[e.estado]}`}>{e.estado}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
              <p className="text-xs text-stone-400">Alta: {e.fechaAlta}</p>
              <button
                onClick={() => toggleEstado(e.id)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-all
                  ${e.estado === "activo"
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
              >
                {e.estado === "activo" ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}