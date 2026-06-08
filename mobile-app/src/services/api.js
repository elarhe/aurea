import axios from "axios";

const BASE_URL = "http://192.168.1.16:4000/api/v1";
// IMPORTANTE: cambia TU_IP por tu IP local (ej: 192.168.1.50)
// Para ver tu IP ejecuta: ipconfig en Windows

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = global.aureaToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) =>
    api.post("/auth/clientes/login", { email, password }),
  registro: (firstName, lastName, email, password, gender) =>
    api.post("/auth/clientes/registro", { firstName, lastName, email, password, gender }),
};

// ── Productos ─────────────────────────────────────────────────────
export const productosService = {
  getAll: (params = {}) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
};

// ── Categorías ────────────────────────────────────────────────────
export const categoriasService = {
  getAll: () => api.get("/categories"),
};

// ── Carrito ───────────────────────────────────────────────────────
export const carritoService = {
  get: () => api.get("/cart"),
  agregar: (productId, variantSku, quantity) =>
    api.post("/cart/items", { productId, variantSku, quantity }),
  actualizar: (itemId, quantity) =>
    api.patch("/cart/items", { itemId, quantity }),
  eliminar: (itemId) => api.delete(`/cart/items/${itemId}`),
  vaciar: () => api.delete("/cart"),
};

// ── Pedidos ───────────────────────────────────────────────────────
export const pedidosService = {
  getMios: () => api.get("/orders/mis-pedidos"),
};

// ── Certificados ─────────────────────────────────────────────────
export const certificadosService = {
  getMios: () => api.get("/certificates/my"),
  verificar: (slug) => api.get(`/certificates/verify/${slug}`),
};

export default api;