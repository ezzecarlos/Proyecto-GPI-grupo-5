import { Package, AlertTriangle, XCircle, ArrowLeftRight, Plus, ClipboardList, BarChart2, TrendingUp, TrendingDown } from "lucide-react";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap";

interface DashboardScreenProps {
  onNavigate: (screen: Screen) => void;
}

const recentMovements = [
  {
    id: 1,
    date: "28/05/2026",
    product: "Polera blanca XL Marca X",
    code: "POL-BLA-XL-X",
    type: "Entrada",
    qty: "+100",
    user: "Administrador",
  },
  {
    id: 2,
    date: "27/05/2026",
    product: "Zapato seguridad 42 Marca Y",
    code: "ZAP-42-Y",
    type: "Salida",
    qty: "-5",
    user: "Administrador",
  },
  {
    id: 3,
    date: "26/05/2026",
    product: "Polera negra M Marca X",
    code: "POL-NEG-M-X",
    type: "Entrada",
    qty: "+30",
    user: "Administrador",
  },
  {
    id: 4,
    date: "25/05/2026",
    product: "Polera blanca XL Marca X",
    code: "POL-BLA-XL-X",
    type: "Ajuste",
    qty: "-10",
    user: "Administrador",
  },
  {
    id: 5,
    date: "24/05/2026",
    product: "Zapato seguridad 42 Marca Y",
    code: "ZAP-42-Y",
    type: "Entrada",
    qty: "+20",
    user: "Administrador",
  },
];

const summaryCards = [
  {
    label: "Productos registrados",
    value: "24",
    icon: Package,
    color: "blue",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    textColor: "text-blue-600",
    trend: "+2 este mes",
    trendUp: true,
  },
  {
    label: "Productos con stock bajo",
    value: "5",
    icon: AlertTriangle,
    color: "yellow",
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    textColor: "text-amber-600",
    trend: "Requiere atención",
    trendUp: false,
  },
  {
    label: "Sin stock",
    value: "2",
    icon: XCircle,
    color: "red",
    bg: "bg-red-50",
    iconColor: "text-red-500",
    textColor: "text-red-600",
    trend: "Urgente reponer",
    trendUp: false,
  },
  {
    label: "Movimientos recientes",
    value: "47",
    icon: ArrowLeftRight,
    color: "violet",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    textColor: "text-violet-600",
    trend: "Este mes",
    trendUp: true,
  },
];

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Dashboard</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>
            Resumen del estado actual del inventario
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-gray-500 mb-1" style={{ fontSize: "0.78rem", fontWeight: 500 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                  {card.value}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {card.trendUp ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span
                    className={card.trendUp ? "text-green-600" : "text-red-500"}
                    style={{ fontSize: "0.75rem" }}
                  >
                    {card.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="mb-6">
          <h3 className="text-gray-700 mb-3" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            Acciones rápidas
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate("productos")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              <Plus className="w-4 h-4" />
              Agregar producto
            </button>
            <button
              onClick={() => onNavigate("movimientos")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              <ClipboardList className="w-4 h-4 text-gray-500" />
              Registrar movimiento
            </button>
            <button
              onClick={() => onNavigate("reportes")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              <BarChart2 className="w-4 h-4 text-gray-500" />
              Ver reportes
            </button>
          </div>
        </div>

        {/* Recent movements table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>
                Últimos movimientos de inventario
              </h3>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: "0.78rem" }}>
                Los 5 movimientos más recientes
              </p>
            </div>
            <button
              onClick={() => onNavigate("movimientos")}
              className="text-blue-600 hover:text-blue-700 transition-colors"
              style={{ fontSize: "0.82rem", fontWeight: 500 }}
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Fecha", "Producto", "Tipo", "Cantidad", "Responsable"].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-gray-400"
                      style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentMovements.map((mov, idx) => (
                  <tr
                    key={mov.id}
                    className={`hover:bg-gray-50 transition-colors ${idx < recentMovements.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                        {mov.date}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>
                          {mov.product}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
                          {mov.code}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full border ${
                          mov.type === "Entrada"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : mov.type === "Salida"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          color: mov.qty.startsWith("+") ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {mov.qty}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#2563EB" }}>A</span>
                        </div>
                        <span className="text-gray-600" style={{ fontSize: "0.85rem" }}>
                          {mov.user}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
