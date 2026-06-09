import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { productosService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import { useIdioma } from "../i18n/IdiomaContext";

export default function ProductoScreen({ route, navigation }) {
  const { slug, producto: productoInicial } = route.params;
  const { cliente } = useAuth();
  const { añadir } = useCarrito();
  const { t } = useIdioma();
  const [producto, setProducto] = useState(productoInicial || null);
  const [cargando, setCargando] = useState(true);
  const [variantSeleccionada, setVariantSeleccionada] = useState(null);
  const [añadiendo, setAñadiendo] = useState(false);

  useEffect(() => {
    productosService.getBySlug(slug, global.aureaLang || "es")
      .then((res) => {
        const data = res.data;
        const p = data.producto || data.product || data;
        setProducto(p);
        if (p?.variants?.length > 0) setVariantSeleccionada(p.variants[0]);
      })
      .catch(() => {
        if (productoInicial?.variants?.length > 0) setVariantSeleccionada(productoInicial.variants[0]);
      })
      .finally(() => setCargando(false));
  }, []);

  const añadirAlCarrito = async () => {
    if (!cliente) {
      Alert.alert(t.producto.loginRequerido, t.producto.loginDesc, [
        { text: t.producto.cancelar, style: "cancel" },
        { text: t.producto.iniciarSesion, onPress: () => navigation.navigate("PerfilTab") },
      ]);
      return;
    }
    if (producto?.variants?.length > 0 && !variantSeleccionada) {
      Alert.alert(t.producto.seleccionaTalla, t.producto.seleccionaTallaDesc);
      return;
    }
    setAñadiendo(true);
    try {
      await añadir(producto._id || producto.id, variantSeleccionada?.sku || "default", 1);
      Alert.alert(t.producto.añadido, `${producto.name || producto.nombre} ${t.producto.añadidoDesc}`, [
        { text: t.producto.verCesta, onPress: () => navigation.navigate("CarritoTab") },
        { text: t.producto.seguirComprando, style: "cancel" },
      ]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || "No se pudo añadir al carrito.");
    } finally {
      setAñadiendo(false);
    }
  };

  if (cargando) return <View style={styles.centered}><ActivityIndicator color="#1c1c1c" /></View>;
  if (!producto) return <View style={styles.centered}><Text style={styles.errorText}>Producto no encontrado</Text></View>;

  const nombre = producto.name || producto.nombre;
  const precio = producto.price || producto.precio || 0;
  const descripcion = producto.description || producto.descripcion;
  const imagen = producto.coverImage || producto.imagen;
  const variantes = producto.variants || [];
  const materiales = producto.materials || producto.materiales || [];
  const catRaw = typeof (producto.category || producto.categoria) === "object"
    ? (producto.category || producto.categoria)?.name
    : (producto.category || producto.categoria);
  const catTraducida = { mujer: t.home.mujer, hombre: t.home.hombre, accesorios: t.home.accesorios }[catRaw?.toLowerCase()] || catRaw;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {imagen ? (
          <Image source={{ uri: imagen }} style={styles.imagen} />
        ) : (
          <View style={[styles.imagen, styles.imagenPlaceholder]}>
            <Text style={styles.placeholderText}>{(nombre || "?")[0]}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.nombre}>{nombre}</Text>
            <View style={styles.precioRow}>
              <Text style={styles.precio}>{precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
              {producto.compareAtPrice && (
                <Text style={styles.precioAntes}>{producto.compareAtPrice.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
              )}
            </View>
          </View>

          {producto.certifiable && (
            <View style={styles.certBanner}>
              <Text style={styles.certIcon}>🛡</Text>
              <Text style={styles.certText}>{t.producto.certifiable}</Text>
            </View>
          )}

          {variantes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.producto.talla}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {variantes.map((v) => (
                  <TouchableOpacity
                    key={v.sku}
                    style={[styles.variantBtn, variantSeleccionada?.sku === v.sku && styles.variantBtnSelected, v.stock === 0 && styles.variantBtnAgotado]}
                    onPress={() => v.stock > 0 && setVariantSeleccionada(v)}
                    disabled={v.stock === 0}
                  >
                    <Text style={[styles.variantText, variantSeleccionada?.sku === v.sku && styles.variantTextSelected, v.stock === 0 && styles.variantTextAgotado]}>
                      {v.size}{v.color ? ` · ${t.colores?.[v.color] || v.color}` : ""}
                    </Text>
                    {v.stock === 0 && <Text style={styles.agotadoLabel}>{t.producto.agotado}</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {descripcion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.producto.descripcion}</Text>
              <Text style={styles.descripcion}>{descripcion}</Text>
            </View>
          )}

          {materiales.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.producto.materiales}</Text>
              {materiales.map((m, i) => (
                <Text key={i} style={styles.descripcion}>{t.materiales?.[m] || m}</Text>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btnAñadir, añadiendo && styles.btnDisabled]}
          onPress={añadirAlCarrito}
          disabled={añadiendo}
        >
          <Text style={styles.btnAñadirText}>{añadiendo ? t.producto.añadiendo : t.producto.añadirCarrito}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf9f7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#999", fontSize: 14 },
  imagen: { width: "100%", height: 400, backgroundColor: "#f0ece6" },
  imagenPlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 64, color: "#999", fontWeight: "700" },
  content: { padding: 24 },
  header: { marginBottom: 16 },
  nombre: { fontSize: 24, fontWeight: "700", color: "#1c1c1c", marginBottom: 8, lineHeight: 32 },
  precioRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  precio: { fontSize: 22, fontWeight: "700", color: "#1c1c1c" },
  precioAntes: { fontSize: 16, color: "#999", textDecorationLine: "line-through" },
  certBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f0ece6", padding: 14, borderRadius: 10, marginBottom: 20 },
  certIcon: { fontSize: 20 },
  certText: { flex: 1, fontSize: 13, color: "#666", lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: "#1c1c1c", marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  variantBtn: { borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginRight: 10, backgroundColor: "#fff" },
  variantBtnSelected: { borderColor: "#1c1c1c", backgroundColor: "#1c1c1c" },
  variantBtnAgotado: { borderColor: "#f0ece6", opacity: 0.5 },
  variantText: { fontSize: 13, color: "#1c1c1c", fontWeight: "500" },
  variantTextSelected: { color: "#fff" },
  variantTextAgotado: { color: "#999" },
  agotadoLabel: { fontSize: 9, color: "#ef4444", marginTop: 2 },
  descripcion: { fontSize: 14, color: "#666", lineHeight: 22 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: "#faf9f7", borderTopWidth: 1, borderTopColor: "#f0ece6" },
  btnAñadir: { backgroundColor: "#1c1c1c", borderRadius: 10, paddingVertical: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnAñadirText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
});
