import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import { useIdioma } from "../i18n/IdiomaContext";
import api from "../services/api";

export default function CarritoScreen({ navigation }) {
  const { cliente } = useAuth();
  const { items, subtotal, totalItems, cargando, cambiarCantidad, vaciar } = useCarrito();
  const { t } = useIdioma();
  const [comprando, setComprando] = useState(false);

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
        subtotal,
        total: subtotal,
        currency: "EUR",
        shippingAddress: {
          recipient: cliente.nombre || "Cliente",
          line1: "Dirección pendiente",
          city: "Madrid",
          postalCode: "28001",
          country: "España",
          countryCode: "ES",
        },
        payment: { provider: "manual", status: "paid" },
      });
      await vaciar();
      Alert.alert(t.carrito.pedidoRealizado, t.carrito.pedidoDesc, [
        { text: t.carrito.verPedidos, onPress: () => navigation.navigate("PerfilTab") },
        { text: t.carrito.seguirComprando, onPress: () => navigation.navigate("CatalogoTab") },
      ]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || e.response?.data?.message || t.carrito.error);
    } finally {
      setComprando(false);
    }
  };

  if (!cliente) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🛍</Text>
        <Text style={styles.emptyTitle}>{t.carrito.loginTitulo}</Text>
        <Text style={styles.emptyDesc}>{t.carrito.loginDesc}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("PerfilTab")}>
          <Text style={styles.btnText}>{t.carrito.iniciarSesion}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cargando) return <View style={styles.centered}><ActivityIndicator color="#1c1c1c" /></View>;

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>{t.carrito.vaciaTitulo}</Text>
        <Text style={styles.emptyDesc}>{t.carrito.vaciaDesc}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("CatalogoTab")}>
          <Text style={styles.btnText}>{t.carrito.irAComprar}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const nombre = item.productName || item.product?.name || "Producto";
    const precio = item.unitPrice || 0;
    const imagen = item.product?.coverImage || item.image;
    const itemId = item._id || item.id;

    return (
      <View style={styles.item}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.itemImagen} />
        ) : (
          <View style={[styles.itemImagen, styles.itemPlaceholder]}>
            <Text style={{ fontSize: 24, color: "#ccc" }}>{nombre[0]}</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.itemNombre} numberOfLines={2}>{nombre}</Text>
          {item.variantSku && <Text style={styles.itemVariant}>{item.variantSku}</Text>}
          <Text style={styles.itemPrecio}>
            {precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </Text>
          <View style={styles.cantidadRow}>
            <TouchableOpacity style={styles.cantidadBtn} onPress={() => cambiarCantidad(itemId, (item.quantity || 1) - 1)}>
              <Text style={styles.cantidadBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.cantidadNum}>{item.quantity || 1}</Text>
            <TouchableOpacity style={styles.cantidadBtn} onPress={() => cambiarCantidad(itemId, (item.quantity || 1) + 1)}>
              <Text style={styles.cantidadBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.eliminarBtn} onPress={() => cambiarCantidad(itemId, 0)}>
          <Text style={styles.eliminarText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(i) => i._id || i.id}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {t.carrito.subtotal} ({totalItems} {totalItems === 1 ? t.carrito.producto : t.carrito.productos})
          </Text>
          <Text style={styles.totalValor}>{subtotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
        </View>
        <Text style={styles.envioText}>{t.carrito.envioGratis}</Text>
        <TouchableOpacity style={[styles.checkoutBtn, comprando && styles.btnDisabled]} onPress={finalizarCompra} disabled={comprando}>
          {comprando ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>{t.carrito.finalizarCompra}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.seguirBtn} onPress={() => navigation.navigate("CatalogoTab")}>
          <Text style={styles.seguirBtnText}>{t.carrito.seguirComprando}</Text>
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
