import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

const api = axios.create({ baseURL: BASE_URL });

// Adjuntar token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aurea_token_cliente");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir en 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("aurea_token_cliente");
      localStorage.removeItem("aurea_cliente");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  loginCliente: (email, password) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),
  registroCliente: ({ firstName, lastName, email, password }) =>
    api.post("/auth/register", { firstName, lastName, email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

// ── Productos ─────────────────────────────────────────────────────────────────
export const productosService = {
  getAll: (params = {}) => api.get("/products", { params }).then((r) => r.data),
  getBySlug: (slug) => api.get(`/products/${slug}`).then((r) => r.data),
};

// ── Categorías ────────────────────────────────────────────────────────────────
export const categoriasService = {
  getAll: () => api.get("/categories").then((r) => r.data),
};

// ── Carrito ───────────────────────────────────────────────────────────────────
export const carritoService = {
  get: () => api.get("/cart").then((r) => r.data),
  agregar: ({ productId, variantSku, quantity }) =>
    api.post("/cart/items", { productId, variantSku, quantity }).then((r) => r.data),
  actualizar: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  eliminar: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
  vaciar: () => api.delete("/cart").then((r) => r.data),
  aplicarCupon: (code) => api.post("/cart/coupon", { code }).then((r) => r.data),
};

// ── Pedidos ───────────────────────────────────────────────────────────────────
export const pedidosService = {
  crear: (data) => api.post("/orders", data).then((r) => r.data),
  getMios: () => api.get("/orders/my").then((r) => r.data),
  getMio: (id) => api.get(`/orders/my/${id}`).then((r) => r.data),
};

// ── Certificados ──────────────────────────────────────────────────────────────
export const certificadosService = {
  getMios: () => api.get("/certificates/my").then((r) => r.data),
  verificar: (slug) => api.get(`/certificates/verify/${slug}`).then((r) => r.data),
};

// ── Reseñas ───────────────────────────────────────────────────────────────────
export const reseñasService = {
  getByProducto: (productId, params = {}) =>
    api.get(`/products/${productId}/reviews`, { params }).then((r) => r.data),
  crear: (productId, data) =>
    api.post(`/products/${productId}/reviews`, data).then((r) => r.data),
};

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const usuariosService = {
  miPerfil: () => api.get("/users/me").then((r) => r.data),
  actualizarPerfil: (data) => api.put("/users/me", data).then((r) => r.data),
  miWishlist: () => api.get("/users/me/wishlist").then((r) => r.data),
  toggleWishlist: (productId) =>
    api.post(`/users/me/wishlist/${productId}`).then((r) => r.data),
  misDirectciones: () => api.get("/users/me/addresses").then((r) => r.data),
  crearDireccion: (data) => api.post("/users/me/addresses", data).then((r) => r.data),
};

export default api;
