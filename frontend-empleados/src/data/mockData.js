export const currentUser = {
  id: 1,
  nombre: "Bohdan Kharuk",
  email: "bohdan@aurea.com",
  rol: "admin",
  avatar: "BK",
};

export const empleados = [
  { id: 1, nombre: "Bohdan Kharuk", email: "bohdan@aurea.com", rol: "admin", estado: "activo", fechaAlta: "2024-09-01" },
  { id: 2, nombre: "Elena Arranz", email: "elena@aurea.com", rol: "admin", estado: "activo", fechaAlta: "2024-09-01" },
  { id: 3, nombre: "Carlos Ruiz", email: "carlos@aurea.com", rol: "empleado", estado: "activo", fechaAlta: "2025-01-15" },
  { id: 4, nombre: "Lucía Martín", email: "lucia@aurea.com", rol: "empleado", estado: "inactivo", fechaAlta: "2024-11-20" },
];

export const categorias = [
  "Vestidos", "Chaquetas", "Pantalones", "Tops", "Abrigos", "Faldas", "Accesorios", "Zapatos"
];

export const productos = [
  { id: 1, nombre: "Vestido Midi Floral", categoria: "Vestidos", precio: 89.99, stock: 24, descripcion: "Vestido midi con estampado floral, ideal para primavera.", imagen: "https://placehold.co/60x60/f5e6d3/8B5E3C?text=V1" },
  { id: 2, nombre: "Blazer Oversize Camel", categoria: "Chaquetas", precio: 129.99, stock: 8, descripcion: "Blazer oversize en tono camel, corte relajado y elegante.", imagen: "https://placehold.co/60x60/d4b896/5a3e28?text=B1" },
  { id: 3, nombre: "Jeans Straight Crop", categoria: "Pantalones", precio: 69.99, stock: 0, descripcion: "Vaquero straight crop de tiro alto, denim 100% algodón.", imagen: "https://placehold.co/60x60/b8c4d4/2c3e50?text=J1" },
  { id: 4, nombre: "Top Lencero Satén", categoria: "Tops", precio: 45.99, stock: 32, descripcion: "Top estilo lencero en satén suave, múltiples colores disponibles.", imagen: "https://placehold.co/60x60/e8d5e8/6b3a6b?text=T1" },
  { id: 5, nombre: "Trench Beige Clásico", categoria: "Abrigos", precio: 189.99, stock: 5, descripcion: "Trench clásico en beige, forro interior desmontable.", imagen: "https://placehold.co/60x60/e8dcc8/7a6548?text=A1" },
  { id: 6, nombre: "Falda Plisada Midi", categoria: "Faldas", precio: 59.99, stock: 17, descripcion: "Falda midi plisada con cintura elástica, caída fluida.", imagen: "https://placehold.co/60x60/d4e8d4/3a6b3a?text=F1" },
];

export const pedidos = [
  { id: "ORD-001", cliente: "Ana García", email: "ana@email.com", fecha: "2025-04-28", total: 159.98, estado: "enviado", productos: ["Vestido Midi Floral", "Top Lencero Satén"] },
  { id: "ORD-002", cliente: "María López", email: "maria@email.com", fecha: "2025-04-27", total: 129.99, estado: "procesando", productos: ["Blazer Oversize Camel"] },
  { id: "ORD-003", cliente: "Carmen Soto", email: "carmen@email.com", fecha: "2025-04-26", total: 249.98, estado: "entregado", productos: ["Trench Beige Clásico", "Jeans Straight Crop"] },
  { id: "ORD-004", cliente: "Laura Pérez", email: "laura@email.com", fecha: "2025-04-25", total: 59.99, estado: "pendiente", productos: ["Falda Plisada Midi"] },
  { id: "ORD-005", cliente: "Sofía Ruiz", email: "sofia@email.com", fecha: "2025-04-24", total: 89.99, estado: "entregado", productos: ["Vestido Midi Floral"] },
  { id: "ORD-006", cliente: "Isabel Mora", email: "isabel@email.com", fecha: "2025-04-23", total: 115.98, estado: "cancelado", productos: ["Jeans Straight Crop", "Top Lencero Satén"] },
];

export const stats = {
  ventasMes: 4820.50,
  pedidosMes: 38,
  clientesNuevos: 12,
  productosSinStock: productos.filter(p => p.stock === 0).length,
};