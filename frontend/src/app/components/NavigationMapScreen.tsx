import { ArrowRight, Lock } from "lucide-react";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap";

interface NavigationMapScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface BoxProps {
  label: string;
  variant?: "primary" | "default" | "destructive" | "muted";
  onClick?: () => void;
}

function Box({ label, variant = "default", onClick }: BoxProps) {
  const styles = {
    primary: "bg-blue-600 text-white border-blue-600 shadow-md",
    default: "bg-white text-gray-700 border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md",
    destructive: "bg-red-50 text-red-700 border-red-300 shadow-sm",
    muted: "bg-gray-50 text-gray-500 border-gray-200 shadow-sm",
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl border-2 transition-all text-center ${styles[variant]} ${onClick ? "cursor-pointer" : "cursor-default"}`}
      style={{ fontSize: "0.82rem", fontWeight: 600, minWidth: "140px", whiteSpace: "nowrap" }}
    >
      {label}
    </button>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 mx-1">
      <ArrowRight className="w-5 h-5 text-blue-400" />
      {label && <span className="text-gray-400" style={{ fontSize: "0.65rem" }}>{label}</span>}
    </div>
  );
}

function VertArrow() {
  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-0.5 h-4 bg-blue-300 rounded" />
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-400" />
      </div>
    </div>
  );
}

export function NavigationMapScreen({ onNavigate }: NavigationMapScreenProps) {
  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Mapa de navegación</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>
            Estructura y flujo de navegación del sistema
          </p>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-amber-700" style={{ fontSize: "0.82rem", fontWeight: 500 }}>
            Sin autenticación, el usuario no puede acceder a las pantallas internas.
          </p>
        </div>

        {/* Navigation flow canvas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Row 1: Login → Dashboard */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 mb-1">
                <Lock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400" style={{ fontSize: "0.7rem" }}>Pantalla pública</span>
              </div>
              <Box label="Inicio de sesión" variant="primary" onClick={() => {}} />
            </div>
            <div className="flex flex-col items-center mx-6">
              <Arrow label="autenticación" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-gray-400" style={{ fontSize: "0.7rem" }}>Pantalla principal</span>
              </div>
              <Box label="Dashboard" variant="primary" onClick={() => onNavigate("dashboard")} />
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-dashed border-gray-200 mb-8" />

          {/* Row 2: Dashboard branches */}
          <div className="mb-2">
            <p className="text-center text-gray-400 mb-5" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Desde Dashboard
            </p>
          </div>

          <div className="flex items-start justify-center gap-6 mb-8">
            {/* Branch 1: Productos */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2563EB" }}>→</span>
                </div>
                <Box label="Listado de productos" onClick={() => onNavigate("productos")} />
              </div>
              <VertArrow />
              <div className="flex flex-col items-center gap-2 mt-2">
                <Box label="Agregar producto" />
                <VertArrow />
                <Box label="Detalle de producto" />
                <VertArrow />
                <div className="flex gap-2">
                  <Box label="Editar producto" />
                  <Box label="Agregar stock" />
                </div>
                <VertArrow />
                <Box label="Eliminar producto" variant="destructive" />
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-100 self-stretch mx-2" />

            {/* Branch 2: Movimientos */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2563EB" }}>→</span>
                </div>
                <Box label="Registrar movimiento" onClick={() => onNavigate("movimientos")} />
              </div>
              <VertArrow />
              <div className="flex flex-col items-center gap-2 mt-2">
                <Box label="Seleccionar producto" variant="muted" />
                <VertArrow />
                <Box label="Tipo de movimiento" variant="muted" />
                <VertArrow />
                <Box label="Confirmar movimiento" variant="muted" />
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-100 self-stretch mx-2" />

            {/* Branch 3: Reportes */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2563EB" }}>→</span>
                </div>
                <Box label="Reportes" onClick={() => onNavigate("reportes")} />
              </div>
              <VertArrow />
              <div className="flex flex-col items-center gap-2 mt-2">
                <Box label="Reporte de stock" variant="muted" />
                <VertArrow />
                <Box label="Historial de movimientos" variant="muted" />
                <VertArrow />
                <Box label="Exportar datos" variant="muted" />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-dashed border-gray-200 mb-6" />

          {/* Detalle → sub-actions */}
          <div>
            <p className="text-center text-gray-400 mb-4" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Desde Detalle de producto
            </p>
            <div className="flex items-center justify-center gap-4">
              <Box label="Detalle de producto" />
              <Arrow />
              <Box label="Editar producto" />
              <div className="mx-2 text-gray-300" style={{ fontWeight: 300 }}>|</div>
              <Box label="Detalle de producto" />
              <Arrow />
              <Box label="Registrar movimiento" />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-md" />
              <span className="text-gray-500" style={{ fontSize: "0.78rem" }}>Pantallas principales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded-md" />
              <span className="text-gray-500" style={{ fontSize: "0.78rem" }}>Pantallas secundarias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded-md" />
              <span className="text-gray-500" style={{ fontSize: "0.78rem" }}>Acción destructiva</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded-md" />
              <span className="text-gray-500" style={{ fontSize: "0.78rem" }}>Pantallas informativas</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span className="text-gray-500" style={{ fontSize: "0.78rem" }}>Flujo de navegación</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
