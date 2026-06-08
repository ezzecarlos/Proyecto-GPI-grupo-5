import { useState } from "react";
import { Plus, Search, X, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal } from "lucide-react";

const movements = [
  { id: 1, date: "28/05/2026", time: "14:32", product: "Polera blanca XL", code: "POL-BLA-XL-X", type: "Entrada", qty: 100, before: 20, after: 120, user: "Administrador", note: "Reposición mensual" },
  { id: 2, date: "27/05/2026", time: "10:15", product: "Zapato seguridad 42", code: "ZAP-42-Y", type: "Salida", qty: 5, before: 5, after: 0, user: "Administrador", note: "Entrega a obra" },
  { id: 3, date: "26/05/2026", time: "16:48", product: "Polera negra M", code: "POL-NEG-M-X", type: "Entrada", qty: 30, before: 0, after: 30, user: "Administrador", note: "" },
  { id: 4, date: "25/05/2026", time: "09:20", product: "Polera blanca XL", code: "POL-BLA-XL-X", type: "Ajuste", qty: 10, before: 130, after: 120, user: "Administrador", note: "Corrección de inventario" },
  { id: 5, date: "24/05/2026", time: "11:05", product: "Zapato seguridad 42", code: "ZAP-42-Y", type: "Entrada", qty: 20, before: 0, after: 20, user: "Administrador", note: "" },
  { id: 6, date: "23/05/2026", time: "13:40", product: "Casco de seguridad S", code: "CAS-S-Y", type: "Salida", qty: 3, before: 15, after: 12, user: "Administrador", note: "Entrega personal" },
];

const typeConfig = {
  Entrada: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: ArrowUpCircle, iconColor: "text-green-500", qtyColor: "#16a34a", sign: "+" },
  Salida: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: ArrowDownCircle, iconColor: "text-red-500", qtyColor: "#dc2626", sign: "-" },
  Ajuste: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: SlidersHorizontal, iconColor: "text-gray-500", qtyColor: "#6b7280", sign: "±" },
};

export function MovimientosScreen() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");

  const filtered = movements.filter((m) => {
    const matchSearch = m.product.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "Todos" || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Movimientos de inventario</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>Historial completo de entradas, salidas y ajustes</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Registrar movimiento
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por producto o código"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ fontSize: "0.875rem" }}
            />
          </div>
          <div className="flex gap-2">
            {["Todos", "Entrada", "Salida", "Ajuste"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                style={{ fontSize: "0.8rem", fontWeight: 500 }}
              >
                {t}
              </button>
            ))}
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
              {filtered.map((mov, idx) => {
                const tc = typeConfig[mov.type as keyof typeof typeConfig];
                const Icon = tc.icon;
                return (
                  <tr key={mov.id} className={`hover:bg-gray-50/60 transition-colors ${idx < filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <td className="px-4 py-3.5">
                      <p style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 500 }}>{mov.date}</p>
                      <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>{mov.time}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>{mov.product}</p>
                      <code className="text-gray-400" style={{ fontSize: "0.72rem" }}>{mov.code}</code>
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
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#2563EB" }}>A</span>
                        </div>
                        {mov.user}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400" style={{ fontSize: "0.78rem" }}>{mov.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register movement modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>Registrar movimiento</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Producto</label>
                <select className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ fontSize: "0.875rem" }}>
                  <option>Seleccionar producto...</option>
                  <option>POL-BLA-XL-X · Polera blanca XL</option>
                  <option>POL-NEG-M-X · Polera negra M</option>
                  <option>ZAP-42-Y · Zapato seguridad 42</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Tipo de movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Entrada", "Salida", "Ajuste"].map((t) => (
                    <button key={t} className="py-2 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 text-gray-600 rounded-lg transition-colors" style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Cantidad</label>
                <input type="number" min="1" defaultValue="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ fontSize: "0.875rem" }} />
              </div>
              <div>
                <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>Nota (opcional)</label>
                <input type="text" placeholder="Descripción del movimiento..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400" style={{ fontSize: "0.875rem" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors" style={{ fontWeight: 600 }}>
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
