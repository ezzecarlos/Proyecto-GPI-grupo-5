import { useState } from "react";
import { Package, AlertCircle } from "lucide-react";
import { api } from "./ui/api";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token); 
      localStorage.setItem('role', data.user.role); 
      localStorage.setItem('userName', data.user.name); 
      localStorage.setItem('userId', String(data.user.id)); 
      onLogin();
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Inventario Local
          </h1>
          <p className="text-gray-500 mt-1" style={{ fontSize: "0.95rem" }}>
            Sistema de gestión de inventario
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span style={{ fontSize: "0.875rem" }}>Correo o contraseña inválidos</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@empresa.cl"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 mb-1.5" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition-colors disabled:opacity-70"
              style={{ fontWeight: 600, fontSize: "0.95rem" }}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Helper text */}
          <p className="text-center text-gray-400 mt-5" style={{ fontSize: "0.8rem" }}>
            Credenciales entregadas por el administrador
          </p>
        </div>
      </div>
    </div>
  );
}