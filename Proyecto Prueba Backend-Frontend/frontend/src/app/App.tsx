import { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardScreen } from "./components/DashboardScreen";
import { ProductListScreen } from "./components/ProductListScreen";
import { MovimientosScreen } from "./components/MovimientosScreen";
import { ReportesScreen } from "./components/ReportesScreen";
import { NavigationMapScreen } from "./components/NavigationMapScreen";
import { EquipoScreen } from "./components/EquipoScreen";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap" | "equipo";

const screenTitles: Record<Screen, string> = {
  dashboard: "Dashboard",
  productos: "Listado de productos",
  movimientos: "Movimientos de inventario",
  reportes: "Reportes",
  navmap: "Mapa de navegación",
  equipo: "Configuración de equipo",
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return !!localStorage.getItem('token');
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('role') || 'VENDEDOR';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || 'Usuario';
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || '';
  });
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");

  const handleLogin = () => {
    setIsLoggedIn(true);
    setUserRole(localStorage.getItem('role') || 'VENDEDOR');
    setUserName(localStorage.getItem('userName') || 'Usuario');
    setUserEmail(localStorage.getItem('userEmail') || '');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserRole('VENDEDOR');
    setUserName('Usuario');
    setUserEmail('');
    setActiveScreen("dashboard");
  };

  const handleNavigate = (screen: Screen) => setActiveScreen(screen);

  const handleProfileUpdate = (newName: string) => {
    localStorage.setItem('userName', newName);
    setUserName(newName);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        userRole={userRole}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          title={screenTitles[activeScreen]}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          onProfileUpdate={handleProfileUpdate}
        />
        <main className="flex-1 overflow-y-auto">
          {activeScreen === "dashboard" && (
            <DashboardScreen onNavigate={handleNavigate} userRole={userRole} />
          )}
          {activeScreen === "productos" && <ProductListScreen userRole={userRole} />}
          {activeScreen === "movimientos" && <MovimientosScreen userRole={userRole} />}
          {activeScreen === "reportes" && <ReportesScreen />}
          {activeScreen === "navmap" && (
            <NavigationMapScreen onNavigate={handleNavigate} />
          )}
          {activeScreen === "equipo" && userRole === "ADMINISTRADOR" && (
            <EquipoScreen />
          )}
        </main>
      </div>
    </div>
  );
}