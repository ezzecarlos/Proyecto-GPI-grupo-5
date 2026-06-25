import { useState, useEffect } from "react";
import { BarChart2, Download, TrendingUp, Package, AlertTriangle, ArrowLeftRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "./ui/api";

export function ReportesScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, movementsData] = await Promise.all([
        api.get('/products'),
        api.get('/movements')
      ]);
      setProducts(productsData);
      setMovements(movementsData);
    } catch (error) {
      console.error("Error al cargar reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrintReport = async () => {
    setGeneratingPdf(true);
    try {
      const token = localStorage.getItem('token');
      
      // Realizar petición asíncrona al backend
      const response = await fetch('/api/reports/inventory', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error en el servidor: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        const text = await response.text();
        let errorMsg = 'El servidor no devolvió un archivo PDF válido.';
        try {
          const json = JSON.parse(text);
          errorMsg = json.message || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      
      // Procesar la respuesta como blob binario
      const blob = await response.blob();
      
      // Generar URL temporal del objeto
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de anclaje invisible, simular click para descarga y removerlo
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte-inventario.pdf');
      document.body.appendChild(link);
      link.click();
      
      // Limpiar/revocar para liberar memoria RAM
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error al generar el reporte PDF:', error);
      alert('Hubo un error al generar el reporte PDF. Revise la consola para más detalles.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // 1. KPIs
  const totalProducts = products.filter(p => p.active).length;
  const lowStockCount = products.filter(p => p.active && p.stock < p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.active && p.stock === 0).length;

  const currentMonthDate = new Date();
  const currentMonthIndex = currentMonthDate.getMonth(); // 0-11
  const currentMonthYear = currentMonthDate.getFullYear();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentMonthName = monthNames[currentMonthIndex];

  const movementsThisMonth = movements.filter(m => {
    const d = new Date(m.created_at);
    return d.getFullYear() === currentMonthYear && d.getMonth() === currentMonthIndex;
  }).length;

  // 2. Stock por categoría (Pie Chart)
  const categoriesMap: Record<string, number> = {};
  products.filter(p => p.active).forEach(p => {
    const cat = p.category || "Sin Categoría";
    categoriesMap[cat] = (categoriesMap[cat] || 0) + (p.stock || 0);
  });

  const colors = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];
  const stockByCat = Object.keys(categoriesMap).map((cat, idx) => ({
    name: cat,
    value: categoriesMap[cat],
    color: colors[idx % colors.length]
  }));

  // 3. Movimientos por mes (Bar Chart - últimos 5 meses)
  const monthsShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const last5Months: any[] = [];
  
  for (let i = 4; i >= 0; i--) {
    const targetDate = new Date(currentMonthYear, currentMonthIndex - i, 1);
    last5Months.push({
      year: targetDate.getFullYear(),
      month: targetDate.getMonth(),
      name: monthsShort[targetDate.getMonth()],
      entradas: 0,
      salidas: 0
    });
  }

  movements.forEach(m => {
    const mDate = new Date(m.created_at);
    const mYear = mDate.getFullYear();
    const mMonth = mDate.getMonth();

    const bucket = last5Months.find(b => b.year === mYear && b.month === mMonth);
    if (bucket) {
      if (m.type === "Entrada") {
        bucket.entradas += m.qty;
      } else if (m.type === "Salida") {
        bucket.salidas += m.qty;
      }
    }
  });

  const movByMonth = last5Months.map(b => ({
    mes: b.name,
    entradas: b.entradas,
    salidas: b.salidas
  }));

  // 4. Productos con alertas de stock
  const stockAlerts = products
    .filter(p => p.active && (p.stock === 0 || p.stock < p.minStock))
    .map(p => ({
      code: p.code,
      name: p.name,
      stock: p.stock,
      min: p.minStock,
      status: p.stock === 0 ? "Sin stock" : "Stock bajo"
    }));

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Reportes</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>Análisis y resumen del estado del inventario</p>
          </div>
          <button 
            onClick={handlePrintReport}
            disabled={generatingPdf}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed font-medium"
            style={{ fontSize: "0.875rem" }}
          >
            {generatingPdf ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Imprimir Reporte</span>
              </>
            )}
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de productos", value: String(totalProducts), icon: Package, bg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Con stock bajo", value: String(lowStockCount), icon: AlertTriangle, bg: "bg-amber-50", iconColor: "text-amber-500" },
            { label: "Sin stock", value: String(outOfStockCount), icon: AlertTriangle, bg: "bg-red-50", iconColor: "text-red-500" },
            { label: `Movimientos ${currentMonthName.toLowerCase()}`, value: String(movementsThisMonth), icon: ArrowLeftRight, bg: "bg-violet-50", iconColor: "text-violet-600" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
                </div>
                <p style={{ fontSize: "1.8rem", fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                  {loading ? "..." : kpi.value}
                </p>
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
                <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>Entradas vs. Salidas ({currentMonthYear})</p>
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
            {loading ? (
              <div className="h-50 flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
            ) : movements.length === 0 ? (
              <div className="h-50 flex items-center justify-center text-gray-400 text-sm">Sin datos de movimientos</div>
            ) : (
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
            )}
          </div>

          {/* Pie chart */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="mb-1" style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>Stock por categoría</h3>
            <p className="text-gray-400 mb-3" style={{ fontSize: "0.78rem" }}>Total de unidades disponibles</p>
            
            {loading ? (
              <div className="h-36 flex items-center justify-center text-gray-400 text-sm">Cargando gráfico...</div>
            ) : stockByCat.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-gray-400 text-sm">Sin productos en stock</div>
            ) : (
              <>
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
                <div className="space-y-2 mt-2 max-h-32 overflow-y-auto pr-1">
                  {stockByCat.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-600" style={{ fontSize: "0.8.rem" }}>{cat.name}</span>
                      </div>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#111827" }}>{cat.value} u.</span>
                    </div>
                  ))}
                </div>
              </>
            )}
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    Cargando alertas de stock...
                  </td>
                </tr>
              ) : stockAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    ✓ Todos los productos tienen stock saludable
                  </td>
                </tr>
              ) : (
                stockAlerts.map((item, idx) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
