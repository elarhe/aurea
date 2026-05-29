import { useState, useEffect } from "react";

export default function AuthModal({ tab, onCambiarTab, onCerrar, onLogin }) {
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirmar: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onCerrar]);

  const cambiarTab = (t) => { setError(""); onCambiarTab(t); };

  const handleLogin = async () => {
    setError("");
    if (!loginForm.email || !loginForm.password) { setError("Introduce email y contraseña"); return; }
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
      onLogin(data.usuario, data.token);
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setCargando(false);
    }
  };

  const handleRegistro = async () => {
    setError("");
    if (!regForm.firstName || !regForm.email || !regForm.password) { setError("Rellena todos los campos obligatorios"); return; }
    if (regForm.password !== regForm.confirmar) { setError("Las contraseñas no coinciden"); return; }
    if (regForm.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setCargando(true);
    try {
      const res = await fetch("http://localhost:4000/api/v1/auth/clientes/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: regForm.firstName, lastName: regForm.lastName, email: regForm.email, password: regForm.password }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.mensaje);
      localStorage.setItem("aurea_token_cliente", data.token);
      localStorage.setItem("aurea_cliente", JSON.stringify(data.usuario));
      onLogin(data.usuario, data.token);
    } catch (err) {
      setError(err.message || "Error al crear la cuenta");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative bg-cream w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onCerrar} className="absolute top-4 right-4 text-stone-400 hover:text-ink transition-colors z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100">✕</button>

        <div className="px-8 pt-8 pb-6 text-center border-b border-stone-200">
          <p className="font-serif text-2xl tracking-widest text-ink mb-1">AUREA</p>
          <h2 className="text-stone-500 text-sm">{tab === "login" ? "Bienvenida de nuevo" : "Crea tu cuenta"}</h2>
        </div>

        <div className="flex border-b border-stone-200">
          <button onClick={() => cambiarTab("login")} className={`flex-1 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors ${tab === "login" ? "text-ink border-b-2 border-ink -mb-px" : "text-stone-400 hover:text-stone-600"}`}>Iniciar sesión</button>
          <button onClick={() => cambiarTab("registro")} className={`flex-1 py-3.5 text-xs uppercase tracking-widest font-medium transition-colors ${tab === "registro" ? "text-ink border-b-2 border-ink -mb-px" : "text-stone-400 hover:text-stone-600"}`}>Crear cuenta</button>
        </div>

        <div className="px-8 py-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-lg">{error}</div>}

          {tab === "login" && (
            <>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Email</label>
                <input type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" autoFocus className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Contraseña</label>
                <div className="relative">
                  <input type={mostrarPass ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••••••" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors pr-16" />
                  <button onClick={() => setMostrarPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600">{mostrarPass ? "Ocultar" : "Ver"}</button>
                </div>
              </div>
              <button onClick={handleLogin} disabled={cargando} className="w-full bg-ink text-cream py-3.5 rounded-xl text-sm font-medium tracking-wide hover:bg-stone-800 transition-colors disabled:opacity-50">{cargando ? "Entrando..." : "Iniciar sesión"}</button>
              <p className="text-center text-xs text-stone-400 pt-1">¿No tienes cuenta? <button onClick={() => cambiarTab("registro")} className="text-ink underline underline-offset-2">Regístrate</button></p>
            </>
          )}

          {tab === "registro" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Nombre *</label>
                  <input type="text" value={regForm.firstName} onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Ana" autoFocus className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Apellido</label>
                  <input type="text" value={regForm.lastName} onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))} placeholder="García" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Email *</label>
                <input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Contraseña *</label>
                <input type="password" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-stone-400 uppercase tracking-widest mb-1.5 block">Confirmar contraseña *</label>
                <input type="password" value={regForm.confirmar} onChange={e => setRegForm(f => ({ ...f, confirmar: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleRegistro()} placeholder="Repite la contraseña" className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-stone-400 transition-colors" />
              </div>
              <button onClick={handleRegistro} disabled={cargando} className="w-full bg-ink text-cream py-3.5 rounded-xl text-sm font-medium tracking-wide hover:bg-stone-800 transition-colors disabled:opacity-50">{cargando ? "Creando cuenta..." : "Crear cuenta"}</button>
              <p className="text-center text-xs text-stone-400 pt-1">¿Ya tienes cuenta? <button onClick={() => cambiarTab("login")} className="text-ink underline underline-offset-2">Inicia sesión</button></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}