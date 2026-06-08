import { useState } from "react";
import { Search, Plus, Eye, Pencil, PlusCircle, Trash2, ChevronDown, Filter, X } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  stock: number;
  minStock: number;
  status: "Disponible" | "Stock bajo" | "Sin stock";
  active: boolean;
}

const initialProducts: Product[] = [
  { id: "1", code: "POL-BLA-XL-X", name: "Polera blanca XL", brand: "Marca X", category: "Ropa", stock: 120, minStock: 10, status: "Disponible", active: true },
  { id: "2", code: "POL-NEG-M-X", name: "Polera negra M", brand: "Marca X", category: "Ropa", stock: 4, minStock: 10, status: "Stock bajo", active: true },
  { id: "3", code: "ZAP-42-Y", name: "Zapato seguridad 42", brand: "Marca Y", category: "Calzado", stock: 0, minStock: 5, status: "Sin stock", active: true },
  { id: "4", code: "PAN-AZU-L-Z", name: "Pantalón azul L", brand: "Marca Z", category: "Ropa", stock: 35, minStock: 8, status: "Disponible", active: true },
  { id: "5", code: "CAS-S-Y", name: "Casco de seguridad S", brand: "Marca Y", category: "EPP", stock: 12, minStock: 15, status: "Stock bajo", active: true },
  { id: "6", code: "GUA-M-Z", name: "Guantes de trabajo M", brand: "Marca Z", category: "EPP", stock: 50, minStock: 20, status: "Disponible", active: true },
  { id: "7", code: "ZAP-40-Y", name: "Zapato seguridad 40", brand: "Marca Y", category: "Calzado", stock: 0, minStock: 5, status: "Sin stock", active: false },
];

const statusConfig = {
  Disponible: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  "Stock bajo": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  "Sin stock": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

type ModalType = "view" | "edit" | "addStock" | "delete" | "add" | null;

export function ProductListScreen() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addStockQty, setAddStockQty] = useState("10");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "Todas" || p.category === categoryFilter;
    const matchStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const categories = ["Todas", ...Array.from(new Set(products.map((p) => p.category)))];
  const statuses = ["Todos", "Disponible", "Stock bajo", "Sin stock"];

  const handleAddStock = () => {
    if (!selectedProduct) return;
    const qty = parseInt(addStockQty) || 0;
    if (qty <= 0) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== selectedProduct.id) return p;
        const newStock = p.stock + qty;
        const newStatus: Product["status"] =
          newStock === 0 ? "Sin stock" : newStock < p.minStock ? "Stock bajo" : "Disponible";
        return { ...p, stock: newStock, status: newStatus };
      })
    );
    setModal(null);
    showToast(`Stock actualizado: +${qty} unidades para ${selectedProduct.name}`);
  };

  const handleDelete = () => {
    if (!selectedProduct) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id ? { ...p, active: false } : p
      )
    );
    setModal(null);
    showToast(`${selectedProduct.name} fue desactivado`);
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
          <span>✓</span> {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Listado de productos</h1>
            <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>
              {products.filter(p => p.active).length} productos activos
            </p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Agregar producto
          </button>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, nombre o categoría"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
              style={{ fontSize: "0.875rem" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500" style={{ fontSize: "0.82rem" }}>Filtros:</span>
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              style={{ fontSize: "0.82rem" }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === "Todas" ? "Categoría: Todas" : c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              style={{ fontSize: "0.82rem" }}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s === "Todos" ? "Estado: Todos" : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Código", "Nombre", "Marca", "Categoría", "Stock actual", "Stock mínimo", "Estado", "Acciones"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-gray-500"
                      style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400" style={{ fontSize: "0.875rem" }}>
                      No se encontraron productos
                    </td>
                  </tr>
                )}
                {filtered.map((product, idx) => {
                  const sc = statusConfig[product.status];
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-50/60 transition-colors ${idx < filtered.length - 1 ? "border-b border-gray-50" : ""} ${!product.active ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <code className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded" style={{ fontSize: "0.75rem" }}>
                          {product.code}
                        </code>
                      </td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>
                          {product.name}
                        </span>
                        {!product.active && (
                          <span className="ml-2 text-gray-400" style={{ fontSize: "0.72rem" }}>(inactivo)</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600" style={{ fontSize: "0.875rem" }}>{product.brand}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: product.stock === 0 ? "#dc2626" : product.stock < product.minStock ? "#d97706" : "#111827" }}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500" style={{ fontSize: "0.875rem" }}>{product.minStock}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${sc.bg} ${sc.text} ${sc.border}`} style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => { setSelectedProduct(product); setModal("view"); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setSelectedProduct(product); setModal("edit"); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {product.active && (
                            <button
                              onClick={() => { setSelectedProduct(product); setAddStockQty("10"); setModal("addStock"); }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              style={{ fontSize: "0.75rem", fontWeight: 600 }}
                              title="Agregar stock"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Agregar stock
                            </button>
                          )}
                          {product.active && (
                            <button
                              onClick={() => { setSelectedProduct(product); setModal("delete"); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer count */}
          <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-gray-400" style={{ fontSize: "0.78rem" }}>
              Mostrando {filtered.length} de {products.length} productos
            </p>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* View modal */}
      {modal === "view" && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>Detalle del producto</h3>
                <code className="text-gray-400 mt-0.5 block" style={{ fontSize: "0.78rem" }}>{selectedProduct.code}</code>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                ["Nombre", selectedProduct.name],
                ["Marca", selectedProduct.brand],
                ["Categoría", selectedProduct.category],
                ["Stock actual", selectedProduct.stock.toString()],
                ["Stock mínimo", selectedProduct.minStock.toString()],
                ["Estado", selectedProduct.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-500" style={{ fontSize: "0.875rem" }}>{label}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#111827" }}>{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setModal(null)} className="mt-5 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modal === "edit" && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>Editar producto</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {["Nombre", "Marca", "Categoría", "Stock mínimo"].map((field) => (
                <div key={field}>
                  <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{field}</label>
                  <input
                    defaultValue={
                      field === "Nombre" ? selectedProduct.name :
                      field === "Marca" ? selectedProduct.brand :
                      field === "Categoría" ? selectedProduct.category :
                      selectedProduct.minStock.toString()
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={() => { setModal(null); showToast("Producto actualizado correctamente"); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add stock modal */}
      {modal === "addStock" && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>Agregar stock</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-gray-500 mb-5" style={{ fontSize: "0.875rem" }}>
              {selectedProduct.name} · Stock actual: <strong>{selectedProduct.stock}</strong>
            </p>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
              <label className="block text-green-700 mb-2" style={{ fontSize: "0.82rem", fontWeight: 600 }}>
                Cantidad a agregar
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAddStockQty((v) => String(Math.max(1, parseInt(v) - 1)))}
                  className="w-9 h-9 bg-white border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center"
                  style={{ fontSize: "1.2rem", fontWeight: 700 }}
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(e.target.value)}
                  className="flex-1 text-center px-3 py-2 border border-green-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  style={{ fontSize: "1.1rem", fontWeight: 700 }}
                />
                <button
                  onClick={() => setAddStockQty((v) => String(parseInt(v) + 1))}
                  className="w-9 h-9 bg-white border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center"
                  style={{ fontSize: "1.2rem", fontWeight: 700 }}
                >+</button>
              </div>
              <p className="text-green-600 mt-2 text-center" style={{ fontSize: "0.78rem" }}>
                Nuevo stock: {selectedProduct.stock + (parseInt(addStockQty) || 0)} unidades
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={handleAddStock} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg transition-colors" style={{ fontWeight: 600 }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === "delete" && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-center mb-2" style={{ fontWeight: 700, fontSize: "1.05rem", color: "#111827" }}>
              ¿Desactivar producto?
            </h3>
            <p className="text-center text-gray-500 mb-5" style={{ fontSize: "0.875rem" }}>
              Se desactivará <strong>{selectedProduct.name}</strong>. Esta acción puede revertirse.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg transition-colors" style={{ fontWeight: 600 }}>
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add product modal */}
      {modal === "add" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#111827" }}>Agregar producto</h3>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["Código", "Nombre", "Marca", "Categoría", "Stock inicial", "Stock mínimo"].map((field) => (
                <div key={field} className={field === "Nombre" ? "col-span-2" : ""}>
                  <label className="block text-gray-700 mb-1" style={{ fontSize: "0.82rem", fontWeight: 500 }}>{field}</label>
                  <input
                    placeholder={field}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={() => { setModal(null); showToast("Producto creado exitosamente"); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors" style={{ fontWeight: 500 }}>
                Crear producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
