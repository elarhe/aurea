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

// ─── STATS ───────────────────────────────────────────────────────────
export const statsService = {
  getDashboard: () => api.get("/stats/dashboard"),
};

// ─── PRODUCTOS ───────────────────────────────────────────────────────
export const productosService = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  crear: (data) => api.post("/products", data),
  editar: (id, data) => api.put(`/products/${id}`, data),
  eliminar: (id) => api.delete(`/products/${id}`),
};

// ─── PEDIDOS ─────────────────────────────────────────────────────────
export const pedidosService = {
  getAll: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cambiarEstado: (id, status, note) =>
    api.patch(`/orders/${id}/status`, { status, note }),
};

// ─── CERTIFICADOS ────────────────────────────────────────────────────
export const certificadosService = {
  getAll: (params) => api.get("/certificates", { params }),
  emitir: (orderId, orderItemId) =>
    api.post("/certificates/emitir", { orderId, orderItemId }),
};

// ─── EMPLEADOS ───────────────────────────────────────────────────────
export const empleadosService = {
  getAll: (params) => api.get("/employees", { params }),
  crear: (data) => api.post("/auth/empleados/crear", data),
  toggleEstado: (id) => api.patch(`/employees/${id}/toggle`),
};

export default api;