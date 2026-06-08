import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl
} from "react-native";
import { productosService } from "../services/api";

const TABS = [
  { label: "Todo", value: "" },
  { label: "Mujer", value: "mujer" },
  { label: "Hombre", value: "hombre" },
  { label: "Accesorios", value: "accesorios" },
];

export default function CatalogoScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tabActivo, setTabActivo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const params = { page: 1, limit: 20 };
      if (busqueda.trim()) params.q = busqueda.trim();
      if (tabActivo) params.category = tabActivo;
      const res = await productosService.getAll(params);
      const data = res.data;
      setProductos(data.productos || data.products || data.data || []);
      setTotal(data.total || data.count || 0);
    } catch (e) {
      console.log("Error:", e.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [busqueda, tabActivo]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const renderProducto = ({ item: p }) => {
    const nombre = p.name || p.nombre;
    const precio = p.price || p.precio || 0;
    const imagen = p.coverImage || p.imagen;
    const categoria = typeof (p.category || p.categoria) === "object"
      ? (p.category || p.categoria)?.name
      : (p.category || p.categoria);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Producto", { slug: p.slug, producto: p })}
        activeOpacity={0.85}
      >
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.imagen} />
        ) : (
          <View style={[styles.imagen, styles.imagenPlaceholder]}>
            <Text style={styles.placeholderText}>{(nombre || "?")[0]}</Text>
          </View>
        )}
        {p.certifiable && (
          <View style={styles.certBadge}>
            <Text style={{ fontSize: 12 }}>🛡</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          {categoria && <Text style={styles.categoria}>{categoria}</Text>}
          <Text style={styles.nombre} numberOfLines={2}>{nombre}</Text>
          <View style={styles.precioRow}>
            <Text style={styles.precio}>
              {precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
            </Text>
            {p.compareAtPrice && (
              <Text style={styles.precioAntes}>
                {p.compareAtPrice.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en Aurea..."
            placeholderTextColor="#aaa"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs género */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, tabActivo === tab.value && styles.tabActivo]}
            onPress={() => setTabActivo(tab.value)}
          >
            <Text style={[styles.tabText, tabActivo === tab.value && styles.tabTextActivo]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultados}>{total} piezas</Text>

      {cargando ? (
        <ActivityIndicator color="#1c1c1c" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={productos}
          renderItem={renderProducto}
          keyExtractor={(p) => p._id || p.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Text style={styles.vacioEmoji}>🔍</Text>
              <Text style={styles.vacioText}>No se encontraron productos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#f5f5f5", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#1c1c1c" },
  clearBtn: { fontSize: 14, color: "#999", padding: 4 },

  // Tabs
  tabsContainer: {
    flexDirection: "row", paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  tab: {
    paddingVertical: 12, paddingHorizontal: 16, marginRight: 4,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabActivo: { borderBottomColor: "#1c1c1c" },
  tabText: { fontSize: 14, color: "#999", fontWeight: "500" },
  tabTextActivo: { color: "#1c1c1c", fontWeight: "700" },

  resultados: { fontSize: 12, color: "#999", paddingHorizontal: 16, paddingVertical: 8 },
  lista: { padding: 12 },
  row: { justifyContent: "space-between", marginBottom: 20 },
  card: { width: "48%", backgroundColor: "#fff" },
  imagen: { width: "100%", height: 200, borderRadius: 8, backgroundColor: "#f5f5f5", marginBottom: 10 },
  imagenPlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 36, color: "#ccc", fontWeight: "700" },
  certBadge: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12,
    width: 26, height: 26, justifyContent: "center", alignItems: "center",
  },
  cardInfo: { paddingHorizontal: 2 },
  categoria: { fontSize: 10, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  nombre: { fontSize: 13, fontWeight: "600", color: "#1c1c1c", marginBottom: 5, lineHeight: 18 },
  precioRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  precio: { fontSize: 14, fontWeight: "700", color: "#1c1c1c" },
  precioAntes: { fontSize: 12, color: "#aaa", textDecorationLine: "line-through" },
  vacio: { alignItems: "center", marginTop: 60 },
  vacioEmoji: { fontSize: 40, marginBottom: 12 },
  vacioText: { color: "#999", fontSize: 14 },
});