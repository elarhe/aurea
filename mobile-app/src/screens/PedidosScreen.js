import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { pedidosService } from "../services/api";
import { useIdioma } from "../i18n/IdiomaContext";

const estadoColor = {
  pending: { bg: "#fef9c3", text: "#854d0e" },
  paid: { bg: "#dcfce7", text: "#166534" },
  processing: { bg: "#dbeafe", text: "#1e40af" },
  shipped: { bg: "#e0e7ff", text: "#3730a3" },
  delivered: { bg: "#dcfce7", text: "#166534" },
  cancelled: { bg: "#fee2e2", text: "#991b1b" },
  refunded: { bg: "#f3f4f6", text: "#374151" },
};

export default function PedidosScreen({ navigation }) {
  const { t } = useIdioma();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    pedidosService.getMios()
      .then((res) => {
        const data = res.data;
        setPedidos(data.pedidos || data.orders || data.data || []);
      })
      .catch((e) => console.log("Error pedidos:", e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <View style={styles.centered}><ActivityIndicator color="#1c1c1c" /></View>;

  if (pedidos.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>📦</Text>
        <Text style={styles.emptyTitle}>{t.pedidos.sinPedidos}</Text>
        <Text style={styles.emptyDesc}>{t.pedidos.sinPedidosDesc}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("CatalogoTab")}>
          <Text style={styles.btnText}>{t.pedidos.explorar}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPedido = ({ item: p }) => {
    const estado = p.status || p.estado || "pending";
    const colores = estadoColor[estado] || estadoColor.pending;
    const fecha = p.createdAt ? new Date(p.createdAt).toLocaleDateString("es-ES") : "—";
    const total = p.total || 0;
    const numItems = p.items?.length || 0;

    return (
      <View style={styles.pedidoCard}>
        <View style={styles.pedidoHeader}>
          <View>
            <Text style={styles.pedidoNumero}>#{p.orderNumber || p._id?.slice(-6).toUpperCase()}</Text>
            <Text style={styles.pedidoFecha}>{fecha}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: colores.bg }]}>
            <Text style={[styles.estadoText, { color: colores.text }]}>
              {t.pedidos.estados[estado] || estado}
            </Text>
          </View>
        </View>

        <View style={styles.pedidoInfo}>
          <Text style={styles.pedidoItems}>
            {numItems} {numItems === 1 ? t.carrito.producto : t.carrito.productos}
          </Text>
          <Text style={styles.pedidoTotal}>
            {total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
          </Text>
        </View>

        {p.items?.slice(0, 2).map((item, i) => (
          <Text key={i} style={styles.pedidoProducto} numberOfLines={1}>
            · {item.productName || item.name || "Producto"}
          </Text>
        ))}
        {p.items?.length > 2 && (
          <Text style={styles.pedidoMas}>+{p.items.length - 2} más</Text>
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={pedidos}
      renderItem={renderPedido}
      keyExtractor={(p) => p._id || p.id}
      contentContainerStyle={styles.lista}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, backgroundColor: "#fff" },
  emptyEmoji: { fontSize: 56, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1c1c1c", marginBottom: 10 },
  emptyDesc: { fontSize: 14, color: "#999", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  btn: { backgroundColor: "#1c1c1c", paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  lista: { padding: 16, backgroundColor: "#f5f5f5" },
  pedidoCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  pedidoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  pedidoNumero: { fontSize: 15, fontWeight: "700", color: "#1c1c1c" },
  pedidoFecha: { fontSize: 12, color: "#999", marginTop: 2 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoText: { fontSize: 11, fontWeight: "600" },
  pedidoInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pedidoItems: { fontSize: 13, color: "#666" },
  pedidoTotal: { fontSize: 15, fontWeight: "700", color: "#1c1c1c" },
  pedidoProducto: { fontSize: 12, color: "#999", marginBottom: 2 },
  pedidoMas: { fontSize: 12, color: "#c9a96e", marginTop: 2 },
});
