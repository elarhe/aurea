import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl
} from "react-native";
import api from "../services/api";
import { useIdioma } from "../i18n/IdiomaContext";
import { getProductoTexto } from "../utils/producto";

export default function CatalogoScreen({ navigation }) {
  const { t } = useIdioma();
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tabActivo, setTabActivo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);

  useEffect(() => { setPagina(1); }, [busqueda, tabActivo]);

  const TABS = [
    { label: t.catalogo.todo, value: "" },
    { label: t.home.mujer, value: "mujer" },
    { label: t.home.hombre, value: "hombre" },
    { label: t.home.accesorios, value: "accesorios" },
  ];

  const cargar = useCallback(async () => {
    try {
      // Llamamos directamente a api para asegurarnos de pasar q correctamente
      const params = { page: pagina, limit: 10 };
      if (busqueda.trim()) params.q = busqueda.trim();
      if (tabActivo) params.category = tabActivo;
      const lang = global.aureaLang;
      if (lang && lang !== "es") params.lang = lang;

      const res = await api.get("/products", { params });
      const data = res.data;
      setProductos(data.productos || data.products || data.data || []);
      setTotal(data.total || data.count || 0);
    } catch (e) {
      console.log("Error:", e.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, [busqueda, tabActivo, pagina]);

  useEffect(() => {
    setCargando(true);
    const timer = setTimeout(cargar, 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  const onRefresh = () => { setRefreshing(true); setPagina(1); };
  const totalPaginas = Math.ceil(total / 10);

  const PaginacionComponent = () => {
    if (totalPaginas <= 1) return null;
    const nums = [...new Set([1, totalPaginas, pagina, pagina - 1, pagina - 2, pagina + 1, pagina + 2])]
      .filter((n) => n >= 1 && n <= totalPaginas)
      .sort((a, b) => a - b);
    const items = [];
    nums.forEach((n, i) => {
      if (i > 0 && n - nums[i - 1] > 1) items.push(<Text key={`e${i}`} style={styles.paginaDots}>…</Text>);
      items.push(
        <TouchableOpacity key={n} onPress={() => setPagina(n)} style={[styles.paginaBtn, pagina === n && styles.paginaBtnActivo]}>
          <Text style={[styles.paginaNum, pagina === n && styles.paginaNumActivo]}>{n}</Text>
        </TouchableOpacity>
      );
    });
    return (
      <View style={styles.paginacion}>
        <TouchableOpacity onPress={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} style={[styles.paginaArrow, pagina === 1 && styles.paginaDisabled]}>
          <Text style={styles.paginaArrowText}>←</Text>
        </TouchableOpacity>
        {items}
        <TouchableOpacity onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} style={[styles.paginaArrow, pagina === totalPaginas && styles.paginaDisabled]}>
          <Text style={styles.paginaArrowText}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProducto = ({ item: p }) => {
    const nombre = getProductoTexto(p, "name", idioma);
    const precio = p.price || p.precio || 0;
    const imagen = p.coverImage || p.imagen;
    const categoria = typeof (p.category || p.categoria) === "object"
      ? (p.category || p.categoria)?.name
      : (p.category || p.categoria);
    const catTraducida = { mujer: t.home.mujer, hombre: t.home.hombre, accesorios: t.home.accesorios }[categoria?.toLowerCase()] || categoria;

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
          {catTraducida && <Text style={styles.categoria}>{catTraducida}</Text>}
          <Text style={styles.nombre} numberOfLines={2}>{nombre}</Text>
          <View style={styles.precioRow}>
            <Text style={styles.precio}>{precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
            {p.compareAtPrice && <Text style={styles.precioAntes}>{p.compareAtPrice.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.catalogo.buscar}
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

      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, tabActivo === tab.value && styles.tabActivo]}
            onPress={() => setTabActivo(tab.value)}
          >
            <Text style={[styles.tabText, tabActivo === tab.value && styles.tabTextActivo]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.resultados}>
        {Math.min(pagina * 10, total) - (pagina - 1) * 10} {t.catalogo.piezas}
      </Text>

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
              <Text style={styles.vacioText}>{t.catalogo.sinResultados}</Text>
            </View>
          }
          ListFooterComponent={<PaginacionComponent />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: "#1c1c1c" },
  clearBtn: { fontSize: 14, color: "#999", padding: 4 },
  tabsContainer: { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  tab: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 4, borderBottomWidth: 2, borderBottomColor: "transparent" },
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
  certBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 12, width: 26, height: 26, justifyContent: "center", alignItems: "center" },
  cardInfo: { paddingHorizontal: 2 },
  categoria: { fontSize: 10, color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  nombre: { fontSize: 13, fontWeight: "600", color: "#1c1c1c", marginBottom: 5, lineHeight: 18 },
  precioRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  precio: { fontSize: 14, fontWeight: "700", color: "#1c1c1c" },
  precioAntes: { fontSize: 12, color: "#aaa", textDecorationLine: "line-through" },
  vacio: { alignItems: "center", marginTop: 60 },
  vacioEmoji: { fontSize: 40, marginBottom: 12 },
  vacioText: { color: "#999", fontSize: 14 },
  paginacion: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, padding: 16, paddingBottom: 24 },
  paginaArrow: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 8 },
  paginaArrowText: { fontSize: 14, color: "#1c1c1c" },
  paginaDisabled: { opacity: 0.35 },
  paginaBtn: { width: 34, height: 34, borderRadius: 6, borderWidth: 1, borderColor: "#e5e0d8", justifyContent: "center", alignItems: "center" },
  paginaBtnActivo: { backgroundColor: "#1c1c1c", borderColor: "#1c1c1c" },
  paginaNum: { fontSize: 13, color: "#1c1c1c", fontWeight: "500" },
  paginaNumActivo: { color: "#fff", fontWeight: "700" },
  paginaDots: { fontSize: 13, color: "#aaa", paddingHorizontal: 2 },
});