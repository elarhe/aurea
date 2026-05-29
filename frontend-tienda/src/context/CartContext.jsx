import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { carritoService } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

const GUEST_CART_KEY = "aurea_guest_cart";

function loadGuestCart() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

const emptyCarrito = { items: [], subtotal: 0, discount: 0, estimatedTotal: 0, couponCode: null };

export function CartProvider({ children }) {
  const { cliente } = useAuth();
  const [carrito, setCarrito] = useState(emptyCarrito);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const itemCount = carrito.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;

  const fetchCarrito = useCallback(async () => {
    if (!cliente) return;
    try {
      const data = await carritoService.get();
      setCarrito(data.cart || data);
    } catch (e) {
      console.error("Error cargando carrito:", e);
    }
  }, [cliente]);

  // Cuando el usuario inicia sesión, sincronizar carrito guest → servidor
  useEffect(() => {
    if (cliente) {
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        Promise.all(
          guestItems.map((item) =>
            carritoService.agregar({
              productId: item.productId,
              variantSku: item.variantSku,
              quantity: item.quantity,
            }).catch(() => null)
          )
        ).then(() => {
          localStorage.removeItem(GUEST_CART_KEY);
          fetchCarrito();
        });
      } else {
        fetchCarrito();
      }
    } else {
      // Usuario deslogueado: mostrar carrito guest si existe
      const guestItems = loadGuestCart();
      if (guestItems.length > 0) {
        const subtotal = guestItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
        setCarrito({ items: guestItems, subtotal, discount: 0, estimatedTotal: subtotal, couponCode: null });
      } else {
        setCarrito(emptyCarrito);
      }
    }
  }, [cliente, fetchCarrito]);

  const agregarItem = async (productId, variantSku, quantity = 1, productData = null) => {
    if (cliente) {
      try {
        const data = await carritoService.agregar({ productId, variantSku, quantity });
        setCarrito(data.cart || data);
        setDrawerOpen(true);
      } catch (e) {
        console.error("Error añadiendo al carrito:", e);
        throw e;
      }
    } else {
      // Carrito guest
      const guestItems = loadGuestCart();
      const idx = guestItems.findIndex(
        (i) => i.productId === productId && i.variantSku === variantSku
      );
      if (idx >= 0) {
        guestItems[idx].quantity += quantity;
      } else {
        guestItems.push({ productId, variantSku, quantity, ...(productData || {}) });
      }
      saveGuestCart(guestItems);
      const subtotal = guestItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
      setCarrito({ items: guestItems, subtotal, discount: 0, estimatedTotal: subtotal, couponCode: null });
      setDrawerOpen(true);
    }
  };

  const actualizarItem = async (itemId, quantity) => {
    if (!cliente) return;
    try {
      const data = await carritoService.actualizar(itemId, quantity);
      setCarrito(data.cart || data);
    } catch (e) {
      console.error("Error actualizando item:", e);
      throw e;
    }
  };

  const eliminarItem = async (itemId) => {
    if (!cliente) {
      const guestItems = loadGuestCart().filter((i) => i.productId !== itemId);
      saveGuestCart(guestItems);
      const subtotal = guestItems.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
      setCarrito({ items: guestItems, subtotal, discount: 0, estimatedTotal: subtotal, couponCode: null });
      return;
    }
    try {
      const data = await carritoService.eliminar(itemId);
      setCarrito(data.cart || data);
    } catch (e) {
      console.error("Error eliminando item:", e);
      throw e;
    }
  };

  const vaciarCarrito = async () => {
    if (!cliente) {
      saveGuestCart([]);
      setCarrito(emptyCarrito);
      return;
    }
    try {
      await carritoService.vaciar();
      setCarrito(emptyCarrito);
    } catch (e) {
      console.error("Error vaciando carrito:", e);
      throw e;
    }
  };

  const aplicarCupon = async (code) => {
    if (!cliente) return;
    try {
      const data = await carritoService.aplicarCupon(code);
      setCarrito(data.cart || data);
    } catch (e) {
      console.error("Error aplicando cupón:", e);
      throw e;
    }
  };

  return (
    <CartContext.Provider
      value={{
        carrito,
        itemCount,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        fetchCarrito,
        agregarItem,
        actualizarItem,
        eliminarItem,
        vaciarCarrito,
        aplicarCupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
