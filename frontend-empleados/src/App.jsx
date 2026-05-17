import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Productos from "./pages/Productos";
import Empleados from "./pages/Empleados";
import Login from "./pages/Login";

const pages = {
  dashboard: <Dashboard />,
  pedidos: <Pedidos />,
  productos: <Productos />,
  empleados: <Empleados />,
};

function PanelLayout() {
  const { empleado, logout, cargando } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  if (cargando) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-stone-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!empleado) return <Login />;

  return (
    <div className="flex min-h-screen bg-stone-100">
      <Sidebar active={activePage} onNav={setActivePage} onLogout={logout} />
      <main className="flex-1 overflow-auto">
        {pages[activePage]}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PanelLayout />
    </AuthProvider>
  );
}