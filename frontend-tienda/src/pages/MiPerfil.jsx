import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { usuariosService } from "../services/api.js";

const TABS = [
  { id: "datos", label: "Datos personales" },
  { id: "seguridad", label: "Seguridad" },
  { id: "wallet", label: "Wallet blockchain" },
  { id: "newsletter", label: "Newsletter" },
];

export default function MiPerfil() {
  const { cliente, login, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("datos");

  useEffect(() => {
    if (!cliente) navigate("/");
  }, [cliente, navigate]);

  if (!cliente) return null;

  return (
    <div className="container-aurea py-16 max-w-3xl">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-aurea-600">Tu cuenta</p>
        <h1 className="font-serif text-4xl mt-2">Mi perfil</h1>
        <div className="section-divider" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-200 mb-8 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs uppercase tracking-widest whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-b-2 border-ink text-ink"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "datos" && <TabDatos cliente={cliente} onActualizar={(data) => login(data, token)} />}
      {tab === "seguridad" && <TabSeguridad />}
      {tab === "wallet" && <TabWallet cliente={cliente} onActualizar={(data) => login(data, token)} />}
      {tab === "newsletter" && <TabNewsletter cliente={cliente} onActualizar={(data) => login(data, token)} />}
    </div>
  );
}

/* ── Tab Datos personales ─────────────────────────────────────────────────── */
function TabDatos({ cliente, onActualizar }) {
  const [form, setForm] = useState({
    firstName: cliente.firstName || "",
    lastName: cliente.lastName || "",
    email: cliente.email || "",
    phone: cliente.phone || "",
    birthDate: cliente.birthDate ? cliente.birthDate.slice(0, 10) : "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const data = await usuariosService.actualizarPerfil(form);
      onActualizar(data.user || data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" value={form.firstName} onChange={(v) => setField("firstName", v)} />
        <Field label="Apellidos" value={form.lastName} onChange={(v) => setField("lastName", v)} />
      </div>
      <Field label="Email" type="email" value={form.email} onChange={(v) => setField("email", v)} />
      <Field label="Teléfono" type="tel" value={form.phone} onChange={(v) => setField("phone", v)} placeholder="+34 600 000 000" />
      <Field label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={(v) => setField("birthDate", v)} />

      {success && <p className="text-green-600 text-sm">Perfil actualizado correctamente.</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

/* ── Tab Seguridad ────────────────────────────────────────────────────────── */
function TabSeguridad() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await usuariosService.actualizarPerfil({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Error al cambiar la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <Field
        label="Contraseña actual"
        type="password"
        value={form.currentPassword}
        onChange={(v) => setField("currentPassword", v)}
        required
      />
      <Field
        label="Nueva contraseña"
        type="password"
        value={form.newPassword}
        onChange={(v) => setField("newPassword", v)}
        required
      />
      <Field
        label="Confirmar nueva contraseña"
        type="password"
        value={form.confirmPassword}
        onChange={(v) => setField("confirmPassword", v)}
        required
      />

      {success && <p className="text-green-600 text-sm">Contraseña actualizada correctamente.</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Cambiando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

/* ── Tab Wallet Blockchain ────────────────────────────────────────────────── */
function TabWallet({ cliente, onActualizar }) {
  const [wallet, setWallet] = useState(cliente.walletAddress || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const data = await usuariosService.actualizarPerfil({ walletAddress: wallet });
      onActualizar(data.user || data);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar la wallet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <div className="mb-6 p-5 border border-aurea-200 bg-aurea-50/40 text-sm text-stone-600 leading-relaxed">
        <p className="font-medium text-ink mb-1 flex items-center gap-2">
          <ShieldIcon /> Vincula tu wallet Ethereum
        </p>
        Vincular tu dirección de wallet te permite recibir los certificados de autenticidad
        directamente en tu dirección de Ethereum. Los certificados son NFTs transferibles.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">
            Dirección Ethereum (0x...)
          </label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="w-full border border-stone-300 px-4 py-3 text-sm font-mono focus:outline-none focus:border-aurea-500 bg-white"
            placeholder="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
            pattern="^0x[a-fA-F0-9]{40}$"
          />
          <p className="text-[10px] text-stone-400 mt-1">Formato: 0x seguido de 40 caracteres hexadecimales</p>
        </div>

        {success && <p className="text-green-600 text-sm">Wallet vinculada correctamente.</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Guardando..." : "Vincular wallet"}
        </button>
      </form>
    </div>
  );
}

/* ── Tab Newsletter ───────────────────────────────────────────────────────── */
function TabNewsletter({ cliente, onActualizar }) {
  const [subscribed, setSubscribed] = useState(cliente.newsletter ?? false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    const newVal = !subscribed;
    try {
      const data = await usuariosService.actualizarPerfil({ newsletter: newVal });
      onActualizar(data.user || data);
      setSubscribed(newVal);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error al actualizar la preferencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <p className="text-stone-600 text-sm mb-6 leading-relaxed">
        Suscríbete a nuestra newsletter para recibir novedades, lanzamientos exclusivos y contenido
        sobre moda sostenible y certificación blockchain.
      </p>

      <div className="flex items-center justify-between p-5 border border-stone-200">
        <div>
          <p className="text-sm font-medium text-ink">Newsletter Aurea</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {subscribed ? "Estás suscrito/a" : "No estás suscrito/a"}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
            subscribed ? "bg-aurea-500" : "bg-stone-200"
          }`}
          role="switch"
          aria-checked={subscribed}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              subscribed ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {success && (
        <p className="text-green-600 text-sm mt-3">
          Preferencia actualizada: {subscribed ? "suscrito/a" : "no suscrito/a"}.
        </p>
      )}
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
    </div>
  );
}

/* ── Componentes auxiliares ──────────────────────────────────────────────── */
function Field({ label, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-aurea-500 bg-white"
      />
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-aurea-600">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" opacity=".2" />
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
