import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Certificate from "./pages/Certificate.jsx";
import Checkout from "./pages/Checkout.jsx";
import MisPedidos from "./pages/MisPedidos.jsx";
import MisCertificados from "./pages/MisCertificados.jsx";
import MiPerfil from "./pages/MiPerfil.jsx";
import AuthModal from "./components/AuthModal.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { useState } from "react";

import { Component } from "react";

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", background: "#fff1f0", minHeight: "100vh" }}>
          <h2 style={{ color: "#b91c1c" }}>Error al renderizar</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#7f1d1d", fontSize: 13 }}>
            {this.state.error.message}\n\n{this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: "8px 16px" }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function AppInner() {
  const [authModal, setAuthModal] = useState(null);
  const { login } = useAuth();

  const handleLogin = (usuario, token) => {
    login(usuario, token);
    setAuthModal(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onAbrirAuth={() => setAuthModal("login")} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Catalog />} />
          <Route path="/tienda/:category" element={<Catalog />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
          <Route path="/certificado/:serial" element={<Certificate />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/mis-certificados" element={<MisCertificados />} />
          <Route path="/perfil" element={<MiPerfil />} />
        </Routes>
      </main>
      <Footer />

      {/* Drawer siempre presente */}
      <CartDrawer />

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

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
      <CartProvider>
        <AppInner />
      </CartProvider>
      </ErrorBoundary>
    </AuthProvider>
  );
}
