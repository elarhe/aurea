import { currentUser } from "../data/mockData";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "pedidos", label: "Pedidos", icon: "◫" },
  { id: "productos", label: "Productos", icon: "▦" },
  { id: "empleados", label: "Empleados", icon: "◉" },
];

export default function Sidebar({ active, onNav }) {
  return (
    <aside className="w-56 min-h-screen bg-stone-900 flex flex-col">
      <div className="px-6 py-6 border-b border-stone-700">
        <h1 className="text-white text-xl font-bold tracking-widest uppercase">Aurea</h1>
        <p className="text-stone-400 text-xs mt-0.5 tracking-wide">Panel de gestión</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left
              ${active === item.id
                ? "bg-amber-500 text-stone-900 font-semibold"
                : "text-stone-400 hover:bg-stone-800 hover:text-white"
              }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-stone-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-stone-900 text-xs font-bold">
            {currentUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{currentUser.nombre}</p>
            <p className="text-stone-400 text-xs capitalize">{currentUser.rol}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}