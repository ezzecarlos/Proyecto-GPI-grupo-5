// src/app/components/ui/api.ts

const BASE_URL = '/api';

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers);
  
  // Inyectar el token JWT si el usuario ya inició sesión
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Configurar el tipo de contenido por defecto a JSON
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Manejo de errores
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error en la petición de red');
  }

  // Devolver la respuesta parseada
  return response.json();
}

// Objeto exportado con los métodos HTTP listos para usar
export const api = {
  get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' }),
};