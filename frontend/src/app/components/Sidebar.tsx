import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  BarChart2,
  LogOut,
  Package2,
} from "lucide-react";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap";

interface SidebarProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard" as Screen, label: "Dashboard", icon: LayoutDashboard },
  { id: "productos" as Screen, label: "Productos", icon: Package },
  { id: "movimientos" as Screen, label: "Movimientos", icon: ArrowLeftRight },
  { id: "reportes" as Screen, label: "Reportes", icon: BarChart2 },
];

export function Sidebar({ activeScreen, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111827", lineHeight: 1.2 }}>
              Inventario Local
            </p>
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", lineHeight: 1.2 }}>
              v1.0 · Prototipo
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeScreen === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
              style={{ fontSize: "0.875rem", fontWeight: isActive ? 600 : 400 }}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-4 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mapa de navegación link */}
      <div className="px-3 pb-2">
        <button
          onClick={() => onNavigate("navmap")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
            activeScreen === "navmap"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
          style={{ fontSize: "0.8rem", fontWeight: activeScreen === "navmap" ? 600 : 400 }}
        >
          <BarChart2 className="w-3.5 h-3.5 flex-shrink-0" />
          Mapa de navegación
        </button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-5 border-t border-gray-100 pt-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-left"
          style={{ fontSize: "0.875rem" }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
