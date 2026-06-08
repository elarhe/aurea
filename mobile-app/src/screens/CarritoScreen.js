import React, { useState, useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import api from "../services/api";

export default function CarritoScreen({ navigation }) {
  const { cliente } = useAuth();
  const { cargar } = useCarrito();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [comprando, setComprando] = useState(false);

  const cargarCarrito = async () => {
    if (!cliente) { setCargando(false); return; }
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

  useEffect(() => { cargarCarrito(); }, [cliente]);

  const cambiarCantidad = async (item, nuevaCantidad) => {
    const itemId = item._id || item.id;
    if (nuevaCantidad <= 0) {
      setItems(prev => prev.filter(i => (i._id || i.id) !== itemId));
      try { await api.delete(`/cart/items/${itemId}`); cargar(); } catch { cargarCarrito(); }
      return;
    }
    setItems(prev => prev.map(i => (i._id || i.id) === itemId ? { ...i, quantity: nuevaCantidad } : i));
    try { await api.patch("/cart/items", { itemId, quantity: nuevaCantidad }); } catch { cargarCarrito(); }
  };

  const finalizarCompra = async () => {
    if (items.length === 0) return;
    setComprando(true);
    try {
      const orderItems = items.map((i) => ({
        product: i.product?._id || i.product,
        variantSku: i.variantSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));
      await api.post("/orders", {
        items: orderItems,
        subtotal: totalCalculado,
        total: totalCalculado,
        currency: "EUR",
        shippingAddress: { recipient: cliente.nombre || "Cliente", line1: "Dirección pendiente", city: "Madrid", postalCode: "28001", country: "España", countryCode: "ES" },
        payment: { provider: "manual", status: "paid" },
      });
      await api.delete("/cart");
      setItems([]);
      cargar();
      Alert.alert("✓ Pedido realizado", "Tu pedido se ha realizado correctamente.", [
        { text: "Ver pedidos", onPress: () => navigation.navigate("PerfilTab") },
        { text: "Seguir comprando", onPress: () => navigation.navigate("CatalogoTab") },
      ]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || e.response?.data?.message || "No se pudo procesar el pedido.");
    } finally {
      setComprando(false);
    }
  };

  if (!cliente) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🛍</Text>
        <Text style={styles.emptyTitle}>Inicia sesión</Text>
        <Text style={styles.emptyDesc}>Necesitas una cuenta para usar el carrito.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("PerfilTab")}><Text style={styles.btnText}>INICIAR SESIÓN</Text></TouchableOpacity>
      </View>
    );
  }

  if (cargando) return <View style={styles.centered}><ActivityIndicator color="#1c1c1c" /></View>;

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Tu cesta está vacía</Text>
        <Text style={styles.emptyDesc}>Explora nuestra colección y añade tus piezas favoritas.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("CatalogoTab")}><Text style={styles.btnText}>IR A COMPRAR</Text></TouchableOpacity>
      </View>
    );
  }

  const totalCalculado = items.reduce((acc, i) => acc + (i.unitPrice || 0) * (i.quantity || 1), 0);

  const renderItem = ({ item }) => {
    const nombre = item.productName || item.product?.name || "Producto";
    const precio = item.unitPrice || 0;
    const imagen = item.product?.coverImage || item.image;
    return (
      <View style={styles.item}>
        {imagen ? <Image source={{ uri: imagen }} style={styles.itemImagen} /> : (
          <View style={[styles.itemImagen, styles.itemPlaceholder]}><Text style={{ fontSize: 24, color: "#ccc" }}>{nombre[0]}</Text></View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre} numberOfLines={2}>{nombre}</Text>
          {item.variantSku && <Text style={styles.itemVariant}>{item.variantSku}</Text>}
          <Text style={styles.itemPrecio}>{precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
          <View style={styles.cantidadRow}>
            <TouchableOpacity style={styles.cantidadBtn} onPress={() => cambiarCantidad(item, (item.quantity || 1) - 1)}>
              <Text style={styles.cantidadBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cantidadNum}>{item.quantity || 1}</Text>
            <TouchableOpacity style={styles.cantidadBtn} onPress={() => cambiarCantidad(item, (item.quantity || 1) + 1)}>
              <Text style={styles.cantidadBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.eliminarBtn} onPress={() => cambiarCantidad(item, 0)}>
          <Text style={styles.eliminarText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList data={items} renderItem={renderItem} keyExtractor={(i) => i._id || i.id} contentContainerStyle={styles.lista} ItemSeparatorComponent={() => <View style={styles.separator} />} />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal ({items.length} {items.length === 1 ? "producto" : "productos"})</Text>
          <Text style={styles.totalValor}>{totalCalculado.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
        </View>
        <Text style={styles.envioText}>Envío gratuito en todos los pedidos</Text>
        <TouchableOpacity style={[styles.checkoutBtn, comprando && styles.btnDisabled]} onPress={finalizarCompra} disabled={comprando}>
          {comprando ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>FINALIZAR COMPRA</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.seguirBtn} onPress={() => navigation.navigate("CatalogoTab")}>
          <Text style={styles.seguirBtnText}>Seguir comprando</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: "#fff" },
  emptyEmoji: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1c1c1c", marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  btn: { backgroundColor: "#1c1c1c", paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  lista: { padding: 20 },
  separator: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 16 },
  item: { flexDirection: "row", gap: 14 },
  itemImagen: { width: 80, height: 100, borderRadius: 8, backgroundColor: "#f5f5f5" },
  itemPlaceholder: { justifyContent: "center", alignItems: "center" },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 14, fontWeight: "600", color: "#1c1c1c", marginBottom: 4, lineHeight: 20 },
  itemVariant: { fontSize: 12, color: "#999", marginBottom: 6 },
  itemPrecio: { fontSize: 15, fontWeight: "700", color: "#1c1c1c", marginBottom: 8 },
  cantidadRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cantidadBtn: { width: 30, height: 30, borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 6, justifyContent: "center", alignItems: "center" },
  cantidadBtnText: { fontSize: 18, fontWeight: "600", color: "#1c1c1c" },
  cantidadNum: { fontSize: 15, fontWeight: "700", color: "#1c1c1c", minWidth: 24, textAlign: "center" },
  eliminarBtn: { padding: 4 },
  eliminarText: { fontSize: 16, color: "#ccc" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#f0f0f0", backgroundColor: "#fff" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  totalLabel: { fontSize: 14, color: "#666" },
  totalValor: { fontSize: 16, fontWeight: "700", color: "#1c1c1c" },
  envioText: { fontSize: 12, color: "#c9a96e", marginBottom: 20 },
  checkoutBtn: { backgroundColor: "#1c1c1c", paddingVertical: 16, alignItems: "center", marginBottom: 12 },
  btnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  seguirBtn: { alignItems: "center", paddingVertical: 8 },
  seguirBtnText: { fontSize: 13, color: "#666", textDecorationLine: "underline" },
});