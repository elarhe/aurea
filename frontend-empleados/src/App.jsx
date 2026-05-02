import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Pedidos from "./pages/Pedidos";
import Productos from "./pages/Productos";
import Empleados from "./pages/Empleados";

const pages = {
  dashboard: <Dashboard />,
  pedidos: <Pedidos />,
  productos: <Productos />,
  empleados: <Empleados />,
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-stone-100">
      <Sidebar active={activePage} onNav={setActivePage} />
      <main className="flex-1 overflow-auto">
        {pages[activePage]}
      </main>
    </div>
  );
}