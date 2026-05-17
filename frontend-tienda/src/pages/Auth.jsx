import { useState } from "react";
import { Link } from "react-router-dom";

export default function Auth() {
  const [tab, setTab] = useState("login"); // "login" | "registro"
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmar: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!loginForm.email || !loginForm.password) {
      setError("Introduce email y contraseña");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/clientes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.mensaje);
      localStorage.setItem("aurea_token_cliente", data.token);
      localStorage.setItem("aurea_cliente", JSON.stringify(data.usuario));
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async () => {
    setError("");
    if (!regForm.firstName || !regForm.email || !regForm.password) {
      setError("Rellena todos los campos obligatorios");
      return;
    }
    if (regForm.password !== regForm.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (regForm.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setCargando(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/clientes/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: regForm.firstName,
          lastName: regForm.lastName,
          email: regForm.email,
          password: regForm.password,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.mensaje);
      localStorage.setItem("aurea_token_cliente", data.token);
      localStorage.setItem("aurea_cliente", JSON.stringify(data.usuario));
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header simple */}
      <header className="border-b border-stone-200 py-5">
        <div className="container-aurea">
          <Link to="/" className="font-serif text-2xl tracking-widest text-ink">
            AUREA
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">

          {/* Título */}
          <div className="text-center mb-10">
            <h1 className="font-serif text-3xl text-ink mb-2">
              {tab === "login" ? "Bienvenida de nuevo" : "Crear cuenta"}
            </h1>
            <p className="text-stone-400 text-sm">
              {tab === "login"
                ? "Accede a tu cuenta para continuar"
                : "Únete a Aurea y descubre moda auténtica"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border border-stone-200 rounded-xl overflow-hidden mb-8">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${tab === "login" ? "bg-ink text-cream" : "bg-white text-stone-500 hover:bg-stone-50"}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setTab("registro"); setError(""); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors
                ${tab === "registro" ? "bg-ink text-cream" : "bg-white text-stone-500 hover:bg-stone-50"}`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          {/* LOGIN */}
          {tab === "login" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarPass ? "text" : "password"}
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors pr-16"
                  />
                  <button
                    onClick={() => setMostrarPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
                  >
                    {mostrarPass ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={cargando}
                className="w-full bg-ink text-cream py-3.5 rounded-xl text-sm font-medium tracking-wide hover:bg-stone-800 transition-colors disabled:opacity-50 mt-2"
              >
                {cargando ? "Entrando..." : "Iniciar sesión"}
              </button>
              <p className="text-center text-xs text-stone-400 pt-2">
                ¿No tienes cuenta?{" "}
                <button onClick={() => { setTab("registro"); setError(""); }} className="text-ink underline">
                  Regístrate aquí
                </button>
              </p>
            </div>
          )}

          {/* REGISTRO */}
          {tab === "registro" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Nombre *</label>
                  <input
                    type="text"
                    value={regForm.firstName}
                    onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Ana"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Apellido</label>
                  <input
                    type="text"
                    value={regForm.lastName}
                    onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="García"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Email *</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Contraseña *</label>
                <input
                  type="password"
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 uppercase tracking-widest mb-2 block">Confirmar contraseña *</label>
                <input
                  type="password"
                  value={regForm.confirmar}
                  onChange={e => setRegForm(f => ({ ...f, confirmar: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleRegistro()}
                  placeholder="Repite la contraseña"
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>
              <button
                onClick={handleRegistro}
                disabled={cargando}
                className="w-full bg-ink text-cream py-3.5 rounded-xl text-sm font-medium tracking-wide hover:bg-stone-800 transition-colors disabled:opacity-50 mt-2"
              >
                {cargando ? "Creando cuenta..." : "Crear cuenta"}
              </button>
              <p className="text-center text-xs text-stone-400 pt-2">
                ¿Ya tienes cuenta?{" "}
                <button onClick={() => { setTab("login"); setError(""); }} className="text-ink underline">
                  Inicia sesión
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}