import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const { cliente } = useAuth();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(false);

  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const subtotal = items.reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0);

  const cargar = async () => {
    if (!cliente) { setItems([]); return; }
    setCargando(true);
    try {
      const res = await api.get("/cart");
      const data = res.data;
      const carrito = data.carrito || data.cart || data;
      setItems(carrito.items || []);
    } catch (e) {
      console.log("Error carrito:", e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [cliente]);

  const añadir = async (productId, variantSku, quantity = 1) => {
    await api.post("/cart/items", { productId, variantSku, quantity });
    await cargar();
  };

  const cambiarCantidad = async (itemId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setItems(prev => prev.filter(i => (i._id || i.id) !== itemId));
      try { await api.delete(`/cart/items/${itemId}`); } catch { await cargar(); }
    } else {
      setItems(prev => prev.map(i => (i._id || i.id) === itemId ? { ...i, quantity: nuevaCantidad } : i));
      try { await api.patch("/cart/items", { itemId, quantity: nuevaCantidad }); } catch { await cargar(); }
    }
  };

  const vaciar = async () => {
    await api.delete("/cart");
    setItems([]);
  };

  return (
    <CarritoContext.Provider value={{ items, subtotal, totalItems, cargando, cargar, añadir, cambiarCantidad, vaciar }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);