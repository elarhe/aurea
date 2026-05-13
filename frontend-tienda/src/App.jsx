import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Certificate from "./pages/Certificate.jsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
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
    </div>
  );
}
