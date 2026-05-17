import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async () => {
    if (!form.email || !form.password) {
      setError("Introduce email y contraseña");
      return;
    }
    setCargando(true);
    setError("");
    try {
      await login(form.email, form.password);
      // AuthContext actualiza el estado y App redirige automáticamente
    } catch (err) {
      setError(err.response?.data?.mensaje || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-widest text-stone-900 uppercase">Aurea</h1>
          <p className="text-stone-400 text-sm mt-2 tracking-wide">Panel de empleados</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-800">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs text-stone-500 mb-1.5 block font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="tu@aurea.com"
                className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs text-stone-500 mb-1.5 block font-medium">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-stone-400 transition-colors pr-10"
                />
                <button
                  onClick={() => setMostrarPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  {mostrarPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={cargando}
            className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-xs text-stone-400 text-center pt-1">
            Acceso exclusivo para personal de Aurea
          </p>
        </div>

        {/* Credenciales de demo */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-1">
          <p className="font-semibold">Credenciales de demo:</p>
          <p>admin@aurea.demo / Admin12345!</p>
        </div>

      </div>
    </div>
  );
}