import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, TextInput
} from "react-native";
import { productosService, reseñasService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import { useIdioma } from "../i18n/IdiomaContext";

function Estrellas({ rating, onSelect, size = 18 }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onSelect?.(s)} disabled={!onSelect}>
          <Text style={{ fontSize: size, color: s <= rating ? "#c9a96e" : "#e5e0d8" }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ReseñaItem({ review }) {
  const nombre = review.user?.firstName
    ? `${review.user.firstName} ${review.user.lastName || ""}`.trim()
    : "Cliente";
  const fecha = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("es-ES")
    : "";

  return (
    <View style={styles.reseñaCard}>
      <View style={styles.reseñaHeader}>
        <View style={styles.reseñaAvatar}>
          <Text style={styles.reseñaAvatarText}>{nombre[0].toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reseñaNombre}>{nombre}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Estrellas rating={review.rating} size={14} />
            <Text style={styles.reseñaFecha}>{fecha}</Text>
          </View>
        </View>
        {review.verifiedPurchase && (
          <Text style={styles.verificado}>✓ Compra verificada</Text>
        )}
      </View>
      {review.title && <Text style={styles.reseñaTitulo}>{review.title}</Text>}
      {review.comment && <Text style={styles.reseñaComentario}>{review.comment}</Text>}
      {review.reply?.message && (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Respuesta de Aurea:</Text>
          <Text style={styles.replyText}>{review.reply.message}</Text>
        </View>
      )}
    </View>
  );
}

export default function ProductoScreen({ route, navigation }) {
  const { slug, producto: productoInicial } = route.params;
  const { cliente } = useAuth();
  const { añadir } = useCarrito();
  const { t } = useIdioma();

  const [producto, setProducto] = useState(productoInicial || null);
  const [cargando, setCargando] = useState(true);
  const [variantSeleccionada, setVariantSeleccionada] = useState(null);
  const [añadiendo, setAñadiendo] = useState(false);

  // Reseñas
  const [reseñas, setReseñas] = useState([]);
  const [totalReseñas, setTotalReseñas] = useState(0);
  const [cargandoReseñas, setCargandoReseñas] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaRating, setNuevaRating] = useState(0);
  const [nuevaTitulo, setNuevaTitulo] = useState("");
  const [nuevaComentario, setNuevaComentario] = useState("");
  const [enviandoReseña, setEnviandoReseña] = useState(false);

  useEffect(() => {
    const lang = global.aureaLang || "es";
    productosService.getBySlug(slug, lang)
      .then((res) => {
        const data = res.data;
        const p = data.producto || data.product || data;
        setProducto(p);
        if (p?.variants?.length > 0) setVariantSeleccionada(p.variants[0]);
        // Cargar reseñas
        cargarReseñas(p._id || p.id);
      })
      .catch(() => {
        if (productoInicial?.variants?.length > 0) setVariantSeleccionada(productoInicial.variants[0]);
      })
      .finally(() => setCargando(false));
  }, []);

  const cargarReseñas = async (productId) => {
    setCargandoReseñas(true);
    try {
      const res = await reseñasService.listar(productId);
      const data = res.data;
      setReseñas(data.reviews || []);
      setTotalReseñas(data.total || 0);
    } catch (e) {
      console.log("Error reseñas:", e.message);
    } finally {
      setCargandoReseñas(false);
    }
  };

  const enviarReseña = async () => {
    if (nuevaRating === 0) { Alert.alert("Error", "Selecciona una puntuación"); return; }
    if (!nuevaComentario.trim()) { Alert.alert("Error", "Escribe un comentario"); return; }
    setEnviandoReseña(true);
    try {
      await reseñasService.crear(producto._id || producto.id, nuevaRating, nuevaTitulo, nuevaComentario);
      Alert.alert("✓ Reseña enviada", "Tu reseña ha sido enviada y está pendiente de aprobación.");
      setMostrarFormulario(false);
      setNuevaRating(0); setNuevaTitulo(""); setNuevaComentario("");
    } catch (e) {
      const msg = e.response?.data?.mensaje || "No se pudo enviar la reseña";
      Alert.alert("Error", msg);
    } finally {
      setEnviandoReseña(false);
    }
  };

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
          {/* Nombre y precio */}
          <View style={styles.header}>
            <Text style={styles.nombre}>{nombre}</Text>
            <View style={styles.precioRow}>
              <Text style={styles.precio}>{precio.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
              {producto.compareAtPrice && (
                <Text style={styles.precioAntes}>{producto.compareAtPrice.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}</Text>
              )}
            </View>
            {/* Rating */}
            {producto.rating > 0 && (
              <View style={styles.ratingRow}>
                <Estrellas rating={Math.round(producto.rating)} size={16} />
                <Text style={styles.ratingText}>{producto.rating.toFixed(1)} ({producto.reviewCount} reseñas)</Text>
              </View>
            )}
          </View>

          {/* Certificable */}
          {producto.certifiable && (
            <View style={styles.certBanner}>
              <Text style={styles.certIcon}>🛡</Text>
              <Text style={styles.certText}>{t.producto.certifiable}</Text>
            </View>
          )}

          {/* Variantes */}
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

          {/* Descripción */}
          {descripcion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.producto.descripcion}</Text>
              <Text style={styles.descripcion}>{descripcion}</Text>
            </View>
          )}

          {/* Materiales */}
          {materiales.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.producto.materiales}</Text>
              {materiales.map((m, i) => (
                <Text key={i} style={styles.descripcion}>{t.materiales?.[m] || m}</Text>
              ))}
            </View>
          )}

          {/* Reseñas */}
          <View style={styles.section}>
            <View style={styles.reseñasHeader}>
              <Text style={styles.sectionTitle}>
                RESEÑAS {totalReseñas > 0 ? `(${totalReseñas})` : ""}
              </Text>
              {cliente && (
                <TouchableOpacity
                  style={styles.btnEscribir}
                  onPress={() => setMostrarFormulario(!mostrarFormulario)}
                >
                  <Text style={styles.btnEscribirText}>
                    {mostrarFormulario ? "Cancelar" : "✏ Escribir reseña"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Formulario nueva reseña */}
            {mostrarFormulario && (
              <View style={styles.formularioReseña}>
                <Text style={styles.formularioTitulo}>Tu valoración</Text>
                <Estrellas rating={nuevaRating} onSelect={setNuevaRating} size={32} />
                <TextInput
                  style={styles.inputReseña}
                  placeholder="Título (opcional)"
                  placeholderTextColor="#bbb"
                  value={nuevaTitulo}
                  onChangeText={setNuevaTitulo}
                />
                <TextInput
                  style={[styles.inputReseña, { height: 100, textAlignVertical: "top" }]}
                  placeholder="Cuéntanos tu experiencia con este producto..."
                  placeholderTextColor="#bbb"
                  value={nuevaComentario}
                  onChangeText={setNuevaComentario}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.btnEnviar, enviandoReseña && styles.btnDisabled]}
                  onPress={enviarReseña}
                  disabled={enviandoReseña}
                >
                  {enviandoReseña
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnEnviarText}>ENVIAR RESEÑA</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            {/* Lista de reseñas */}
            {cargandoReseñas ? (
              <ActivityIndicator color="#1c1c1c" style={{ marginTop: 16 }} />
            ) : reseñas.length === 0 ? (
              <View style={styles.sinReseñas}>
                <Text style={styles.sinReseñasEmoji}>💬</Text>
                <Text style={styles.sinReseñasText}>Aún no hay reseñas para este producto.</Text>
                {cliente && !mostrarFormulario && (
                  <Text style={styles.sinReseñasSub}>¡Sé el primero en opinar!</Text>
                )}
              </View>
            ) : (
              reseñas.map((r) => <ReseñaItem key={r._id} review={r} />)
            )}
          </View>

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
  precioRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  precio: { fontSize: 22, fontWeight: "700", color: "#1c1c1c" },
  precioAntes: { fontSize: 16, color: "#999", textDecorationLine: "line-through" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  ratingText: { fontSize: 13, color: "#666" },
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

  // Reseñas
  reseñasHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  btnEscribir: { backgroundColor: "#f0ece6", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  btnEscribirText: { fontSize: 12, color: "#1c1c1c", fontWeight: "600" },
  formularioReseña: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#f0ece6" },
  formularioTitulo: { fontSize: 14, fontWeight: "700", color: "#1c1c1c", marginBottom: 12 },
  inputReseña: { borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: "#1c1c1c", backgroundColor: "#faf9f7", marginTop: 12 },
  btnEnviar: { backgroundColor: "#1c1c1c", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 14 },
  btnDisabled: { opacity: 0.6 },
  btnEnviarText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  sinReseñas: { alignItems: "center", paddingVertical: 24 },
  sinReseñasEmoji: { fontSize: 36, marginBottom: 10 },
  sinReseñasText: { fontSize: 14, color: "#999", textAlign: "center" },
  sinReseñasSub: { fontSize: 13, color: "#c9a96e", marginTop: 6 },
  reseñaCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#f0ece6" },
  reseñaHeader: { flexDirection: "row", gap: 10, marginBottom: 8 },
  reseñaAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0ece6", justifyContent: "center", alignItems: "center" },
  reseñaAvatarText: { fontSize: 14, fontWeight: "700", color: "#1c1c1c" },
  reseñaNombre: { fontSize: 13, fontWeight: "600", color: "#1c1c1c", marginBottom: 2 },
  reseñaFecha: { fontSize: 11, color: "#999" },
  verificado: { fontSize: 10, color: "#c9a96e", fontWeight: "600" },
  reseñaTitulo: { fontSize: 14, fontWeight: "700", color: "#1c1c1c", marginBottom: 4 },
  reseñaComentario: { fontSize: 13, color: "#666", lineHeight: 20 },
  replyBox: { backgroundColor: "#f5f5f5", borderRadius: 8, padding: 10, marginTop: 10 },
  replyLabel: { fontSize: 11, fontWeight: "700", color: "#1c1c1c", marginBottom: 4 },
  replyText: { fontSize: 13, color: "#666", lineHeight: 18 },

  // Footer
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: "#faf9f7", borderTopWidth: 1, borderTopColor: "#f0ece6" },
  btnAñadir: { backgroundColor: "#1c1c1c", borderRadius: 10, paddingVertical: 16, alignItems: "center" },
  btnAñadirText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
});