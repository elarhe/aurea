import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: BASE_URL });

// Adjunta el token JWT a todas las peticiones si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aurea_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira, redirige al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("aurea_token");
      localStorage.removeItem("aurea_empleado");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) =>
    api.post("/auth/empleados/login", { email, password }),

  me: () => api.get("/auth/me"),
};

// ─── PRODUCTOS ───────────────────────────────────────────────────────
export const productosService = {
  getAll: () => api.get("/productos"),
  getById: (id) => api.get(`/productos/${id}`),
  crear: (data) => api.post("/productos", data),
  editar: (id, data) => api.put(`/productos/${id}`, data),
  eliminar: (id) => api.delete(`/productos/${id}`),
};

// ─── PEDIDOS ─────────────────────────────────────────────────────────
export const pedidosService = {
  getAll: () => api.get("/pedidos"),
  getById: (id) => api.get(`/pedidos/${id}`),
  cambiarEstado: (id, estado) => api.patch(`/pedidos/${id}/estado`, { estado }),
};

// ─── EMPLEADOS ───────────────────────────────────────────────────────
export const empleadosService = {
  getAll: () => api.get("/empleados"),
  toggleEstado: (id) => api.patch(`/empleados/${id}/toggle-estado`),
  crear: (data) => api.post("/auth/empleados/crear", data),
};

export default api;