import { Bell, ChevronDown, User } from "lucide-react";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between flex-shrink-0 shadow-sm">
      <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827" }}>{title}</h2>
      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border border-white" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
              Administrador
            </p>
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", lineHeight: 1.2 }}>
              admin@inventario.cl
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
        </button>
      </div>
    </header>
  );
}
