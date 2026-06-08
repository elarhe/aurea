import React, { createContext, useContext, useState, useEffect } from "react";
import { carritoService } from "../services/api";
import { useAuth } from "./AuthContext";

const CarritoContext = createContext(null);

export function CarritoProvider({ children }) {
  const { cliente } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [cargando, setCargando] = useState(false);

  const totalItems = items.reduce((acc, i) => acc + (i.quantity || 1), 0);

  const cargar = async () => {
    if (!cliente) { setItems([]); setSubtotal(0); return; }
    setCargando(true);
    try {
      const res = await carritoService.get();
      const data = res.data;
      const carrito = data.cart || data.carrito || data;
      setItems(carrito.items || []);
      setSubtotal(carrito.subtotal || 0);
    } catch (e) {
      console.log("Error carrito:", e.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [cliente]);

  const añadir = async (productId, variantSku, quantity = 1) => {
    const res = await carritoService.agregar(productId, variantSku, quantity);
    await cargar();
    return res;
  };

  const eliminar = async (itemId) => {
    await carritoService.eliminar(itemId);
    setItems((prev) => prev.filter((i) => (i._id || i.id) !== itemId));
  };

  const vaciar = async () => {
    await carritoService.vaciar();
    setItems([]);
    setSubtotal(0);
  };

  return (
    <CarritoContext.Provider value={{ items, setItems, subtotal, totalItems, cargando, cargar, añadir, eliminar, vaciar }}>
      {children}
    </CarritoContext.Provider>
  );
}

export const useCarrito = () => useContext(CarritoContext);