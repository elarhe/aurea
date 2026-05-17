import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Certificate from "./pages/Certificate.jsx";
import AuthModal from "./components/AuthModal.jsx";

export default function App() {
  const [authModal, setAuthModal] = useState(null);

  const [cliente, setCliente] = useState(() => {
    try {
      const guardado = localStorage.getItem("aurea_cliente");
      return guardado ? JSON.parse(guardado) : null;
    } catch { return null; }
  });

  const handleLogin = (usuario) => {
    setCliente(usuario);
    setAuthModal(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("aurea_token_cliente");
    localStorage.removeItem("aurea_cliente");
    setCliente(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onAbrirAuth={() => setAuthModal("login")}
        cliente={cliente}
        onLogout={handleLogout}
      />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Catalog />} />
          <Route path="/tienda/:category" element={<Catalog />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
          <Route path="/certificado/:serial" element={<Certificate />} />
        </Routes>
      </main>
      <Footer />

      {authModal && (
        <AuthModal
          tab={authModal}
          onCambiarTab={setAuthModal}
          onCerrar={() => setAuthModal(null)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}