import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardScreen } from "./components/DashboardScreen";
import { ProductListScreen } from "./components/ProductListScreen";
import { MovimientosScreen } from "./components/MovimientosScreen";
import { ReportesScreen } from "./components/ReportesScreen";
import { NavigationMapScreen } from "./components/NavigationMapScreen";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap";

const screenTitles: Record<Screen, string> = {
  dashboard: "Dashboard",
  productos: "Listado de productos",
  movimientos: "Movimientos de inventario",
  reportes: "Reportes",
  navmap: "Mapa de navegación",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveScreen("dashboard");
  };
  const handleNavigate = (screen: Screen) => setActiveScreen(screen);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={screenTitles[activeScreen]} />
        <main className="flex-1 overflow-y-auto">
          {activeScreen === "dashboard" && (
            <DashboardScreen onNavigate={handleNavigate} />
          )}
          {activeScreen === "productos" && <ProductListScreen />}
          {activeScreen === "movimientos" && <MovimientosScreen />}
          {activeScreen === "reportes" && <ReportesScreen />}
          {activeScreen === "navmap" && (
            <NavigationMapScreen onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}
