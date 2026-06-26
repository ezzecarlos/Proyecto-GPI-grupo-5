import { useState, useEffect, useRef } from "react";
import {
  Bell,
  ChevronDown,
  User,
  X,
  Check,
  AlertTriangle,
  XCircle,
  Info,
  LogOut,
  Package,
  ClipboardList,
  BarChart2,
  Users,
  Lock,
} from "lucide-react";
import { api } from "./ui/api";

type Screen = "dashboard" | "productos" | "movimientos" | "reportes" | "navmap" | "equipo";

interface TopBarProps {
  title: string;
  userName: string;
  userEmail: string;
  userRole: string;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onProfileUpdate: (newName: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "critical" | "warning" | "info";
  timestamp: Date;
  read: boolean;
  link?: Screen;
}

export function TopBar({
  title,
  userName,
  userEmail,
  userRole,
  onNavigate,
  onLogout,
  onProfileUpdate,
}: TopBarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Form states for profile modal
  const [profileName, setProfileName] = useState(userName);
  const [profilePassword, setProfilePassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Refs for closing on outside click
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load profileName when modal opens
  useEffect(() => {
    if (profileModalOpen) {
      setProfileName(userName);
      setProfilePassword("");
      setProfileConfirmPassword("");
      setProfileError("");
      setProfileSuccess(false);
    }
  }, [profileModalOpen, userName]);

  // Handle outside click for popovers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const [products, predictiveAlerts, movements] = await Promise.all([
        api.get("/products").catch(() => []),
        api.get("/products/predictive-alerts").catch(() => []),
        api.get("/movements").catch(() => []),
      ]);

      const readIds: string[] = JSON.parse(
        localStorage.getItem("read_notifications") || "[]"
      );

      const items: Notification[] = [];

      // 1. Falta de stock
      products
        .filter((p: any) => p.active && p.stock === 0)
        .forEach((p: any) => {
          const id = `out-stock-${p.id}`;
          items.push({
            id,
            title: "Sin Stock",
            message: `El producto "${p.name}" está totalmente agotado.`,
            type: "critical",
            timestamp: new Date(),
            read: readIds.includes(id),
            link: "productos",
          });
        });

      // 2. Stock bajo
      products
        .filter((p: any) => p.active && p.stock > 0 && p.stock < p.minStock)
        .forEach((p: any) => {
          const id = `low-stock-${p.id}`;
          items.push({
            id,
            title: "Stock Bajo",
            message: `"${p.name}" tiene ${p.stock} unidades (mínimo ${p.minStock}).`,
            type: "warning",
            timestamp: new Date(),
            read: readIds.includes(id),
            link: "productos",
          });
        });

      // 3. Alertas predictivas (solo si stock > 0, para no duplicar sin stock)
      predictiveAlerts
        .filter((a: any) => a.daysLeft <= 7 && a.stock > 0)
        .forEach((a: any) => {
          const id = `predictive-${a.id}`;
          items.push({
            id,
            title: "Riesgo de Quiebre",
            message: `Se prevé agotamiento de "${a.name}" en ${a.daysLeft} días (venta: ${a.dailyVelocity} u./dia).`,
            type: "critical",
            timestamp: new Date(),
            read: readIds.includes(id),
            link: "productos",
          });
        });

      // 4. Cambios recientes (últimos 5 movimientos)
      movements.slice(0, 5).forEach((m: any) => {
        const id = `movement-${m.id}`;
        items.push({
          id,
          title: `Movimiento: ${m.type}`,
          message: `${m.userName} registró ${m.type.toLowerCase()} de ${m.qty} u. de "${m.productName || m.productCode}".`,
          type: "info",
          timestamp: new Date(m.created_at),
          read: readIds.includes(id),
          link: "movimientos",
        });
      });

      // Sort by read (unread first) then date or type
      items.sort((a, b) => {
        if (a.read === b.read) {
          const priorities = { critical: 3, warning: 2, info: 1 };
          return priorities[b.type] - priorities[a.type];
        }
        return a.read ? 1 : -1;
      });

      setNotifications(items);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    const readIds: string[] = JSON.parse(
      localStorage.getItem("read_notifications") || "[]"
    );
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem("read_notifications", JSON.stringify(readIds));
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    const readIds: string[] = JSON.parse(
      localStorage.getItem("read_notifications") || "[]"
    );
    notifications.forEach((n) => {
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
      }
    });
    localStorage.setItem("read_notifications", JSON.stringify(readIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id);
    setNotificationsOpen(false);
    if (n.link) {
      onNavigate(n.link);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    if (!profileName || profileName.trim() === "") {
      setProfileError("El nombre es obligatorio");
      return;
    }

    if (profilePassword !== "") {
      if (profilePassword.length < 4) {
        setProfileError("La contraseña debe tener al menos 4 caracteres");
        return;
      }
      if (profilePassword !== profileConfirmPassword) {
        setProfileError("Las contraseñas no coinciden");
        return;
      }
    }

    setUpdatingProfile(true);
    try {
      const data = await api.put("/auth/profile", {
        name: profileName,
        password: profilePassword ? profilePassword : undefined,
      });

      onProfileUpdate(data.name);
      setProfileSuccess(true);
      setTimeout(() => {
        setProfileModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setProfileError(err.message || "Error al actualizar perfil");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const roleBadges: Record<string, { bg: string; text: string; label: string }> = {
    ADMINISTRADOR: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Administrador" },
    BODEGUERO: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Bodeguero" },
    VENDEDOR: { bg: "bg-green-50 border-green-200", text: "text-green-700", label: "Vendedor" },
  };

  const currentRoleBadge = roleBadges[userRole] || {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-700",
    label: userRole,
  };

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between flex-shrink-0 shadow-sm relative z-40">
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#111827" }}>
          {title}
        </h2>
        <div className="flex items-center gap-4">
          
          {/* Notification bell and popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserMenuOpen(false);
                if (!notificationsOpen) {
                  fetchNotifications();
                }
              }}
              className={`relative w-8.5 h-8.5 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all cursor-pointer ${
                notificationsOpen ? "bg-gray-50 text-gray-700 shadow-inner" : ""
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-red-500 text-white rounded-full border-2 border-white flex items-center justify-center font-bold text-3xs animate-bounce shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-84 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col transition-all animate-scale-up">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-xs text-gray-700 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-blue-500" />
                    Notificaciones y Cambios
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-2xs text-blue-600 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 flex-1">
                  {loadingNotifications && notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Cargando alertas...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center text-gray-400 text-xs">
                      No hay notificaciones ni cambios importantes.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon =
                        n.type === "critical"
                          ? XCircle
                          : n.type === "warning"
                          ? AlertTriangle
                          : Info;
                      const iconColor =
                        n.type === "critical"
                          ? "text-red-500 bg-red-50"
                          : n.type === "warning"
                          ? "text-amber-500 bg-amber-50"
                          : "text-blue-500 bg-blue-50";

                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 flex gap-3 text-left transition-colors cursor-pointer hover:bg-gray-50/80 ${
                            !n.read ? "bg-blue-50/20" : ""
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-semibold text-2xs text-gray-800 truncate">
                                {n.title}
                              </span>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-3xs text-gray-500 leading-normal line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/30 text-center">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        onNavigate("dashboard");
                      }}
                      className="text-3xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
                    >
                      Ir al dashboard principal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotificationsOpen(false);
              }}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all cursor-pointer ${
                userMenuOpen ? "bg-gray-50 shadow-xs" : ""
              }`}
            >
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">
                  {userName ? userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </span>
              </div>
              <div className="text-left hidden sm:block">
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
                  {userName}
                </p>
                <p style={{ fontSize: "0.72rem", color: "#9CA3AF", lineHeight: 1.2 }}>
                  {userEmail || "Sin email registrado"}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-1 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-2.5 animate-scale-up">
                {/* Details header */}
                <div className="px-2 py-1.5 flex flex-col gap-1 border-b border-gray-50 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 truncate flex-1">
                      {userName}
                    </span>
                    <span className={`text-4xs px-2 py-0.5 border rounded-full font-bold uppercase ${currentRoleBadge.bg} ${currentRoleBadge.text}`}>
                      {currentRoleBadge.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 truncate">
                    {userEmail}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-gray-700 hover:bg-blue-50/50 hover:text-blue-700 transition-colors cursor-pointer font-medium"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Mi Cuenta
                  </button>

                  <div className="border-t border-gray-50 my-1.5" />
                  
                  {/* Role-specific shortcuts */}
                  <span className="text-4xs font-bold text-gray-400 uppercase px-2.5 mb-1 tracking-wider">
                    Accesos directos
                  </span>

                  {userRole === "ADMINISTRADOR" && (
                    <>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("equipo");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        Administrar Equipo
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("productos");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Ver Catálogo
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("reportes");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                        Ver Reportes
                      </button>
                    </>
                  )}

                  {userRole === "BODEGUERO" && (
                    <>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("productos");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Ver Catálogo
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("movimientos");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                        Registrar Movimiento
                      </button>
                    </>
                  )}

                  {userRole === "VENDEDOR" && (
                    <>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("productos");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        Ver Catálogo (Lectura)
                      </button>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate("reportes");
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-gray-400" />
                        Ver Reportes
                      </button>
                    </>
                  )}

                  <div className="border-t border-gray-50 my-1.5" />

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Account Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-scale-up">
            {/* Modal header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900" style={{ fontSize: "1.1rem" }}>
                  Configuración de Cuenta
                </h3>
                <p className="text-3xs text-gray-400 mt-0.5">
                  Edita tus datos personales de acceso
                </p>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body & Form */}
            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-2xs flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-2xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>¡Perfil actualizado con éxito!</span>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-semibold text-gray-700 uppercase tracking-wide">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                  required
                />
              </div>

              {/* Email field (readonly) */}
              <div className="space-y-1.5">
                <label className="block text-2xs font-semibold text-gray-400 uppercase tracking-wide">
                  Correo Electrónico (No modificable)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full px-3 py-2 border border-gray-100 rounded-lg text-xs bg-gray-100 text-gray-400 cursor-not-allowed font-medium"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5 pt-1.5 border-t border-gray-50">
                <label className="block text-2xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-gray-400" />
                  Nueva Contraseña (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Dejar vacío si no deseas cambiarla"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                />
              </div>

              {/* Confirm password field */}
              {profilePassword !== "" && (
                <div className="space-y-1.5 animate-slide-down">
                  <label className="block text-2xs font-semibold text-gray-700 uppercase tracking-wide">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Escribe la misma contraseña"
                    value={profileConfirmPassword}
                    onChange={(e) => setProfileConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium"
                    required
                  />
                </div>
              )}

              {/* Modal footer / buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors font-semibold shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {updatingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

