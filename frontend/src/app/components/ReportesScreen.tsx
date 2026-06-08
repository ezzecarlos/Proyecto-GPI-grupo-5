import { BarChart2, Download, TrendingUp, Package, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const movByMonth = [
  { mes: "Ene", entradas: 45, salidas: 20 },
  { mes: "Feb", entradas: 60, salidas: 35 },
  { mes: "Mar", entradas: 30, salidas: 25 },
  { mes: "Abr", entradas: 80, salidas: 40 },
  { mes: "May", entradas: 47, salidas: 22 },
];

const stockByCat = [
  { name: "Ropa", value: 159, color: "#2563EB" },
  { name: "Calzado", value: 0, color: "#EF4444" },
  { name: "EPP", value: 62, color: "#10B981" },
];

const stockAlerts = [
  { code: "POL-NEG-M-X", name: "Polera negra M", stock: 4, min: 10, status: "Stock bajo" },
  { code: "CAS-S-Y", name: "Casco de seguridad S", stock: 12, min: 15, status: "Stock bajo" },
  { code: "ZAP-42-Y", name: "Zapato seguridad 42", stock: 0, min: 5, status: "Sin stock" },
  { code: "ZAP-40-Y", name: "Zapato seguridad 40", stock: 0, min: 5, status: "Sin stock" },
];

export function ReportesScreen() {
  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Reportes</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>Análisis y resumen del estado del inventario</p>
          </div>
          <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg transition-colors shadow-sm" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            <Download className="w-4 h-4 text-gray-500" />
            Exportar reporte
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de productos", value: "24", icon: Package, bg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Con stock bajo", value: "5", icon: AlertTriangle, bg: "bg-amber-50", iconColor: "text-amber-500" },
            { label: "Sin stock", value: "2", icon: AlertTriangle, bg: "bg-red-50", iconColor: "text-red-500" },
            { label: "Movimientos mayo", value: "47", icon: ArrowLeftRight, bg: "bg-violet-50", iconColor: "text-violet-600" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
                </div>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111827", lineHeight: 1 }}>{kpi.value}</p>
                <p className="text-gray-500 mt-1" style={{ fontSize: "0.78rem" }}>{kpi.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-4 mb-4">
          {/* Bar chart */}
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>Movimientos por mes</h3>
                <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>Entradas vs. Salidas (2026)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-gray-500" style={{ fontSize: "0.75rem" }}>Entradas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded" />
                  <span className="text-gray-500" style={{ fontSize: "0.75rem" }}>Salidas</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={movByMonth} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "0.8rem", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  cursor={{ fill: "#f9fafb" }}
                />
                <Bar dataKey="entradas" fill="#2563EB" radius={[4, 4, 0, 0]} name="Entradas" />
                <Bar dataKey="salidas" fill="#F87171" radius={[4, 4, 0, 0]} name="Salidas" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="mb-1" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>Stock por categoría</h3>
            <p className="text-gray-400 mb-3" style={{ fontSize: "0.78rem" }}>Total de unidades disponibles</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={stockByCat} cx="50%" cy="50%" outerRadius={65} dataKey="value" paddingAngle={3}>
                  {stockByCat.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "0.8rem" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {stockByCat.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-gray-600" style={{ fontSize: "0.8rem" }}>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827" }}>{cat.value} u.</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>Productos con alertas de stock</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Código", "Nombre", "Stock actual", "Stock mínimo", "Estado"].map((col) => (
                  <th key={col} className="px-5 py-3 text-left text-gray-400" style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockAlerts.map((item, idx) => (
                <tr key={item.code} className={`hover:bg-gray-50/60 ${idx < stockAlerts.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-5 py-3.5">
                    <code className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded" style={{ fontSize: "0.75rem" }}>{item.code}</code>
                  </td>
                  <td className="px-5 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>{item.name}</td>
                  <td className="px-5 py-3.5" style={{ fontSize: "0.95rem", fontWeight: 700, color: item.stock === 0 ? "#dc2626" : "#d97706" }}>{item.stock}</td>
                  <td className="px-5 py-3.5 text-gray-500" style={{ fontSize: "0.875rem" }}>{item.min}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${item.status === "Sin stock" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Sin stock" ? "bg-red-500" : "bg-amber-500"}`} />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
