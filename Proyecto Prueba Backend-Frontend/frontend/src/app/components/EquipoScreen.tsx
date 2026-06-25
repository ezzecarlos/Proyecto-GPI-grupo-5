import { useState, useEffect } from "react";
import { UserPlus, Shield, Mail, Key, User, AlertCircle, Edit2, Trash2 } from "lucide-react";
import { api } from "./ui/api";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: "ADMINISTRADOR" | "BODEGUERO" | "VENDEDOR";
}

export function EquipoScreen() {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Editing state
  const [editingUser, setEditingUser] = useState<TeamMember | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMINISTRADOR" | "BODEGUERO" | "VENDEDOR">("VENDEDOR");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error("Error al cargar equipo:", error);
      showToast("Error de conexión al obtener usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (member: TeamMember) => {
    setEditingUser(member);
    setName(member.name);
    setEmail(member.email);
    setPassword("");
    setRole(member.role);
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("VENDEDOR");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !role) {
      setFormError("Nombre, correo y rol son campos obligatorios");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        // Modificar usuario
        const updated = await api.put(`/users/${editingUser.id}`, {
          name,
          email,
          role,
          password: password.trim() !== "" ? password : undefined
        });
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
        handleCancelEdit();
        showToast("Miembro del equipo modificado con éxito");
      } else {
        // Agregar usuario (requiere contraseña)
        if (!password) {
          setFormError("La contraseña es obligatoria para un nuevo usuario");
          setSubmitting(false);
          return;
        }
        const newUser = await api.post('/users', { name, email, password, role });
        setUsers((prev) => [...prev, newUser]);
        setName("");
        setEmail("");
        setPassword("");
        setRole("VENDEDOR");
        showToast("Miembro del equipo agregado con éxito");
      }
    } catch (error: any) {
      setFormError(error.message || "Error al procesar la solicitud");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este miembro del equipo?")) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("Miembro del equipo eliminado con éxito");
      if (editingUser?.id === id) {
        handleCancelEdit();
      }
    } catch (error: any) {
      showToast(error.message || "Error al eliminar el usuario");
    }
  };

  const roleLabels = {
    ADMINISTRADOR: { text: "Administrador", bg: "bg-purple-50 text-purple-700 border-purple-200" },
    BODEGUERO: { text: "Bodeguero (Operario)", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    VENDEDOR: { text: "Vendedor (Consulta)", bg: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  const currentUserId = Number(localStorage.getItem('userId'));

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2" style={{ fontSize: "0.875rem" }}>
          <span>✓</span> {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>Configuración de equipo</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "0.875rem" }}>
            Administra los roles, accesos y permisos de los miembros de tu organización
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* List Users column */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>Miembros activos</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">Cargando miembros...</div>
                ) : users.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">No hay usuarios registrados</div>
                ) : (
                  users.map((member) => {
                    const labelCfg = roleLabels[member.role] || roleLabels.VENDEDOR;
                    return (
                      <div key={member.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#111827" }}>{member.name}</p>
                            <p style={{ fontSize: "0.78rem", color: "#9CA3AF" }}>{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-semibold ${labelCfg.bg}`}>
                            {labelCfg.text}
                          </span>
                          <button
                            onClick={() => handleEditClick(member)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Modificar miembro"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {member.id !== currentUserId ? (
                            <button
                              onClick={() => handleDeleteUser(member.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar miembro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-7 h-7" /> // Espaciador para mantener alineación
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Create/Edit User column */}
          <div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#111827" }}>
                  {editingUser ? "Modificar miembro" : "Agregar miembro"}
                </h3>
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg mb-4 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-600 mb-1" style={{ fontSize: "0.8rem", fontWeight: 500 }}>Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1" style={{ fontSize: "0.8rem", fontWeight: 500 }}>Correo electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="juan@empresa.cl"
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                    {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={editingUser ? "•••••••• (dejar en blanco)" : "••••••••"}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1" style={{ fontSize: "0.8rem", fontWeight: 500 }}>Rol asignado</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm appearance-none cursor-pointer"
                    >
                      <option value="ADMINISTRADOR">Administrador (Total)</option>
                      <option value="BODEGUERO">Bodeguero (Operaciones)</option>
                      <option value="VENDEDOR">Vendedor (Solo lectura)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    {submitting ? "Guardando..." : editingUser ? "Modificar" : "Agregar"}
                  </button>
                  {editingUser && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg transition-colors font-semibold text-sm cursor-pointer shadow-sm"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
