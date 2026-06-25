import { useState, useEffect } from "react";
import { Plus, Search, X, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, AlertCircle, Download } from "lucide-react";
import { api } from "./ui/api";

interface Movement {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  type: "Entrada" | "Salida" | "Ajuste";
  qty: number;
  before: number;
  after: number;
  userName: string;
  note: string;
  created_at: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  stock: number;
  minStock: number;
  active: boolean;
}

const typeConfig = {
  Entrada: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: ArrowUpCircle, iconColor: "text-green-500", qtyColor: "#16a34a", sign: "+" },
  Salida: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: ArrowDownCircle, iconColor: "text-red-500", qtyColor: "#dc2626", sign: "-" },
  Ajuste: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: SlidersHorizontal, iconColor: "text-gray-500", qtyColor: "#6b7280", sign: "±" },
};

export function MovimientosScreen({ userRole }: { userRole: string }) {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  
  // Date range filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Dynamic lists from backend
  const [movementsList, setMovementsList] = useState<Movement[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<"Entrada" | "Salida" | "Ajuste">("Entrada");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Agregar filtros de rango de fechas si existen
      let movementsUrl = '/movements';
      const params: string[] = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) {
        movementsUrl += `?${params.join('&')}`;
      }

      const [movementsData, productsData] = await Promise.all([
        api.get(movementsUrl),
        api.get('/products')
      ]);
      setMovementsList(movementsData);
      setProductsList(productsData);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      showToast("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]); // Se vuelve a cargar si cambian los filtros de fechas

  const handleOpenModal = () => {
    setSelectedProductId("");
    setMovementType("Entrada");
    setQty(1);
    setNote("");
    setModalError(null);
    setShowModal(true);
  };

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedProductId) {
      setModalError("Debe seleccionar un producto");
      return;
    }

    if (qty <= 0) {
      setModalError("La cantidad debe ser mayor a cero");
      return;
    }

    const selectedProduct = productsList.find(p => p.id.toString() === selectedProductId.toString());
    if (movementType === "Salida" && selectedProduct && selectedProduct.stock < qty) {
      setModalError(`Stock insuficiente. Stock disponible: ${selectedProduct.stock} unidades`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/movements', {
        productId: parseInt(selectedProductId),
        type: movementType,
        qty: qty,
        note: note
      });
      showToast("Movimiento registrado con éxito");
      setShowModal(false);
      await fetchData(); // Refrescar tablas
    } catch (error: any) {
      setModalError(error.message || "Error al registrar movimiento en el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (movementsList.length === 0) return;
    setExporting(true);

    // Simular un tiempo de carga breve de 1 segundo para mostrar el loader premium
    setTimeout(() => {
      try {
        const headers = ["ID", "Fecha", "Hora", "Producto", "Código", "Tipo", "Cantidad", "Stock Anterior", "Stock Nuevo", "Responsable", "Nota"];
        
        const rows = movementsList.map(m => [
          m.id,
          formatDate(m.created_at),
          formatTime(m.created_at),
          `"${m.productName?.replace(/"/g, '""')}"`,
          m.productCode,
          m.type,
          m.qty,
          m.before,
          m.after,
          `"${m.userName?.replace(/"/g, '""')}"`,
          `"${(m.note || "").replace(/"/g, '""')}"`
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');

        // Crear blob del CSV con marca UTF-8 para Excel
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `reporte_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("Reporte CSV generado e iniciado descarga");
      } catch (error) {
        console.error("Error al exportar reporte:", error);
        showToast("Error al exportar reporte");
      } finally {
        setExporting(false);
      }
    }, 1000);
  };

  const filtered = movementsList.filter((m) => {
    const pName = m.productName || "";
    const pCode = m.productCode || "";
    const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) || pCode.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "Todos" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const formatDate = (isoString: string) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return "—";
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
          <span>✓</span> {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Movimientos de inventario</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>Historial completo de entradas, salidas y ajustes</p>
          </div>
          {userRole !== "VENDEDOR" && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
              style={{ fontSize: "0.875rem", fontWeight: 500 }}
            >
              <Plus className="w-4 h-4" />
              Registrar movimiento
            </button>
          )}
        </div>

        {/* Filters and Date Pickers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-80">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por producto o código"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              />
            </div>
            <div className="flex gap-1">
              {["Todos", "Entrada", "Salida", "Ajuste"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium text-xs ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Date range picker + CSV Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-xs font-semibold">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              />
              <span className="text-gray-400 text-xs font-semibold">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500"
                  title="Limpiar fechas"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-px bg-gray-150 h-6 mx-1" />

            <button
              onClick={handleExportCSV}
              disabled={exporting || movementsList.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white px-3.5 py-2 rounded-lg transition-colors shadow-sm text-xs font-semibold cursor-pointer"
              title="Exportar a CSV"
            >
              {exporting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Fecha / Hora", "Producto", "Tipo", "Cantidad", "Stock anterior", "Stock nuevo", "Responsable", "Nota"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-gray-400" style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    Cargando historial de movimientos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                    No se encontraron movimientos registrados
                  </td>
                </tr>
              ) : (
                filtered.map((mov, idx) => {
                  const tc = typeConfig[mov.type] || typeConfig.Ajuste;
                  const Icon = tc.icon;
                  return (
                    <tr key={mov.id} className={`hover:bg-gray-50/60 transition-colors ${idx < filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                      <td className="px-4 py-3.5">
                        <p style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>{formatDate(mov.created_at)}</p>
                        <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>{formatTime(mov.created_at)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>{mov.productName}</p>
                        <code className="text-gray-400" style={{ fontSize: "0.72rem" }}>{mov.productCode}</code>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${tc.bg} ${tc.text} ${tc.border}`} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          <Icon className={`w-3 h-3 ${tc.iconColor}`} />
                          {mov.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontSize: "1rem", fontWeight: 700, color: tc.qtyColor }}>
                          {tc.sign}{mov.qty}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500" style={{ fontSize: "0.875rem" }}>{mov.before}</td>
                      <td className="px-4 py-3.5" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{mov.after}</td>
                      <td className="px-4 py-3.5 text-gray-600" style={{ fontSize: "0.85rem" }}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#2563EB" }}>{mov.userName ? mov.userName.charAt(0).toUpperCase() : "S"}</span>
                          </div>
                          {mov.userName}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-400" style={{ fontSize: "0.78rem" }}>{mov.note || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register movement modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterMovement} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>Registrar movimiento</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {modalError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg mb-4 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Producto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ fontSize: "0.875rem" }}
                >
                  <option value="">Seleccionar producto...</option>
                  {productsList.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.id}>{p.code} · {p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Tipo de movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Entrada", "Salida", "Ajuste"].map((t) => {
                    const isSelected = movementType === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMovementType(t as any)}
                        className={`py-2 border-2 rounded-lg transition-colors font-medium text-xs ${
                          isSelected 
                            ? "border-blue-600 bg-blue-50 text-blue-600" 
                            : "border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-gray-50"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Nota (opcional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Descripción del movimiento..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors"
                style={{ fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors disabled:opacity-50"
                style={{ fontWeight: 600 }}
              >
                {submitting ? "Registrando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
