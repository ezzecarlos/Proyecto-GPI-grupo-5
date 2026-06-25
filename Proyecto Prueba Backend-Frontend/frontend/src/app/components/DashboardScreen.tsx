import { useState, useEffect } from "react";
import { Package, AlertTriangle, XCircle, ArrowLeftRight, Plus, ClipboardList, BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { api } from "./ui/api";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap";

interface DashboardScreenProps {
  onNavigate: (screen: Screen) => void;
  userRole: string;
}

export function DashboardScreen({ onNavigate, userRole }: DashboardScreenProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, movementsData, alertsData] = await Promise.all([
        api.get('/products'),
        api.get('/movements'),
        api.get('/products/predictive-alerts')
      ]);
      setProducts(productsData);
      setMovements(movementsData);
      setPredictiveAlerts(alertsData);
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalProducts = products.filter(p => p.active).length;
  const lowStockCount = products.filter(p => p.active && p.stock < p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.active && p.stock === 0).length;
  const movementsCount = movements.length;

  const summaryCards = [
    {
      label: "Productos registrados",
      value: String(totalProducts),
      icon: Package,
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "En catálogo activo",
      trendUp: true,
    },
    {
      label: "Productos con stock bajo",
      value: String(lowStockCount),
      icon: AlertTriangle,
      bg: "bg-amber-50",
      iconColor: "text-amber-500",
      trend: lowStockCount > 0 ? "Requiere atención" : "Catálogo saludable",
      trendUp: false,
    },
    {
      label: "Sin stock",
      value: String(outOfStockCount),
      icon: XCircle,
      bg: "bg-red-50",
      iconColor: "text-red-500",
      trend: outOfStockCount > 0 ? "Urgente reponer" : "Sin faltantes",
      trendUp: false,
    },
    {
      label: "Movimientos registrados",
      value: String(movementsCount),
      icon: ArrowLeftRight,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      trend: "Historial de stock",
      trendUp: true,
    },
  ];

  const recentFiveMovements = movements.slice(0, 5);

  const formatDate = (isoString: string) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Clasificar las alertas predictivas según nivel de urgencia
  const classifiedAlerts = predictiveAlerts.map(alert => {
    const isCritical = alert.daysLeft <= 2 || alert.stock === 0;
    return {
      ...alert,
      urgency: isCritical ? "Crítico" : "Atención",
      colorClass: isCritical
        ? { bg: "bg-red-50/90", border: "border-red-100", text: "text-red-900", icon: "text-red-600", bar: "bg-red-500" }
        : { bg: "bg-amber-50/90", border: "border-amber-100", text: "text-amber-900", icon: "text-amber-500", bar: "bg-amber-500" }
    };
  });

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Page header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Dashboard</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>
              Resumen del estado actual del inventario
            </p>
          </div>
          <div className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full font-bold uppercase">
            Rol: {userRole}
          </div>
        </div>

        {/* Módulo 1: Alertas Predictivas de Quiebre de Stock */}
        {!loading && classifiedAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-gray-800" style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                Alertas Predictivas de Stock (Agotamiento &lt; 7 días)
              </h3>
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xxs font-bold animate-pulse">
                Acción requerida
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {classifiedAlerts.map((alert) => {
                // Barra de progreso indica qué tan cerca está el producto de llegar a cero.
                // Usamos minStock como referencia: pct = (stock actual / minStock) * 100
                const pct = Math.min(100, Math.max(0, (alert.stock / (alert.minStock || 10)) * 100));

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-xl p-4 shadow-sm flex flex-col justify-between ${alert.colorClass.bg} ${alert.colorClass.border}`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-xxs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white shadow-xs border text-gray-600">
                          {alert.urgency} · {alert.stock === 0 ? "Sin Stock" : `Agotamiento en ${alert.daysLeft} días`}
                        </span>
                        <AlertTriangle className={`w-4 h-4 ${alert.colorClass.icon} flex-shrink-0`} />
                      </div>
                      <h4 className={`font-semibold mt-2.5 text-sm ${alert.colorClass.text}`}>
                        {alert.name}
                      </h4>
                      <code className="text-gray-400 block text-xxs mt-0.5">{alert.code}</code>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xxs mb-1.5 font-medium text-gray-500">
                        <span>Stock: {alert.stock} u.</span>
                        <span>Mínimo: {alert.minStock} u.</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden border border-black/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${alert.colorClass.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xxs text-gray-400 mt-2">
                        Velocidad de venta diaria: <strong>{alert.dailyVelocity}</strong> u./día
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                  {loading ? "..." : card.value}
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
            {userRole !== "VENDEDOR" && (
              <button
                onClick={() => onNavigate("productos")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                <Plus className="w-4 h-4" />
                Ver catálogo
              </button>
            )}
            {userRole !== "VENDEDOR" && (
              <button
                onClick={() => onNavigate("movimientos")}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                style={{ fontSize: "0.875rem", fontWeight: 500 }}
              >
                <ClipboardList className="w-4 h-4 text-gray-500" />
                Registrar movimiento
              </button>
            )}
            <button
              onClick={() => onNavigate("reportes")}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
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
              className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
              style={{ fontSize: "0.82rem", fontWeight: 500 }}
            >
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      Cargando movimientos recientes...
                    </td>
                  </tr>
                ) : recentFiveMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  recentFiveMovements.map((mov, idx) => {
                    const isEntrada = mov.type === "Entrada";
                    const isSalida = mov.type === "Salida";
                    
                    return (
                      <tr
                        key={mov.id}
                        className={`hover:bg-gray-50 transition-colors ${idx < recentFiveMovements.length - 1 ? "border-b border-gray-50" : ""}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                            {formatDate(mov.created_at)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>
                              {mov.productName}
                            </p>
                            <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
                              {mov.productCode}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border ${
                              isEntrada
                                ? "bg-green-50 text-green-700 border-green-200"
                                : isSalida
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
                              color: isEntrada ? "#16a34a" : isSalida ? "#dc2626" : "#6b7280",
                            }}
                          >
                            {isEntrada ? "+" : isSalida ? "-" : ""}{mov.qty}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#2563EB" }}>
                                {mov.userName ? mov.userName.charAt(0).toUpperCase() : "A"}
                              </span>
                            </div>
                            <span className="text-gray-600" style={{ fontSize: "0.85rem" }}>
                              {mov.userName}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
