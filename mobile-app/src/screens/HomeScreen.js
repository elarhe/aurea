import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, ImageBackground, Dimensions
} from "react-native";
import { productosService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const { height } = Dimensions.get("window");
const HERO_IMAGE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=80";

export default function HomeScreen({ navigation }) {
  const { cliente } = useAuth();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    productosService.getAll({ limit: 6, sort: "featured" })
      .then((res) => {
        const data = res.data;
        setProductos(data.productos || data.products || data.data || []);
      })
      .catch((e) => console.log("Error:", e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HERO */}
      <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.hero} resizeMode="cover">
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEtiqueta}>COLECCIÓN SS26 · AURORA</Text>
          <Text style={styles.heroTitulo}>{"Cada prenda,\nuna historia\núnica."}</Text>
          <View style={styles.heroDivider} />
          <Text style={styles.heroDesc}>
            Moda atemporal con certificado de autenticidad verificable en blockchain.
          </Text>
          <TouchableOpacity style={styles.heroBtnPrimary} onPress={() => navigation.navigate("CatalogoTab")}>
            <Text style={styles.heroBtnPrimaryText}>DESCUBRIR COLECCIÓN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroBtnOutline}>
            <Text style={styles.heroBtnOutlineText}>VERIFICAR CERTIFICADO</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* BANNER OFERTA */}
      <View style={styles.ofertaBanner}>
        <View style={styles.ofertaLeft}>
          <Text style={styles.ofertaEtiqueta}>OFERTA LIMITADA</Text>
          <Text style={styles.ofertaTitulo}>Hasta 30% dto.</Text>
          <Text style={styles.ofertaDesc}>En toda la colección de verano. Solo hasta fin de mes.</Text>
          <TouchableOpacity style={styles.ofertaBtn} onPress={() => navigation.navigate("CatalogoTab")}>
            <Text style={styles.ofertaBtnText}>VER OFERTAS →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.ofertaRight}>
        <Text style={styles.ofertaEmoji}>🏷</Text>
        <Text style={styles.ofertaPorcentaje}>30%</Text>
        <Text style={styles.ofertaDscto}>DTO</Text>
        </View>
      </View>

      {/* UNIVERSOS */}
      <View style={styles.section}>
        <Text style={styles.sectionEtiqueta}>UNIVERSOS AUREA</Text>
        <Text style={styles.sectionTitulo}>Explora la colección</Text>
        <View style={styles.universosRow}>
          {[
            { label: "Mujer", emoji: "👗", cat: "mujer" },
            { label: "Hombre", emoji: "👔", cat: "hombre" },
            { label: "Accesorios", emoji: "👜", cat: "accesorios" },
          ].map((u) => (
            <TouchableOpacity key={u.cat} style={styles.universoCard} onPress={() => navigation.navigate("CatalogoTab")} activeOpacity={0.8}>
              <Text style={styles.universoEmoji}>{u.emoji}</Text>
              <Text style={styles.universoLabel}>{u.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* DESTACADOS */}
      <View style={styles.section}>
        <Text style={styles.sectionEtiqueta}>SELECCIÓN</Text>
        <Text style={styles.sectionTitulo}>Piezas destacadas</Text>
        {cargando ? (
          <ActivityIndicator color="#1c1c1c" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -4 }}>
            {productos.map((p) => (
              <TouchableOpacity
                key={p._id || p.id}
                style={styles.productoCard}
                onPress={() => navigation.navigate("HomeStack", { screen: "Producto", params: { slug: p.slug, producto: p } })}
                activeOpacity={0.85}
              >
                {p.coverImage ? (
                  <Image source={{ uri: p.coverImage }} style={styles.productoImagen} />
                ) : (
                  <View style={[styles.productoImagen, styles.productoPlaceholder]}>
                    <Text style={styles.placeholderText}>{(p.name || p.nombre || "?")[0]}</Text>
                  </View>
                )}
                <Text style={styles.productoCategoria}>
                  {typeof (p.category || p.categoria) === "object"
                    ? (p.category || p.categoria)?.name
                    : (p.category || p.categoria) || ""}
                </Text>
                <Text style={styles.productoNombre} numberOfLines={2}>{p.name || p.nombre}</Text>
                <Text style={styles.productoPrecio}>
                  {(p.price || p.precio || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* CÓMO FUNCIONA BLOCKCHAIN */}
      <View style={styles.blockchainSection}>
        <Text style={styles.sectionEtiqueta} style={{ color: "#c9a96e", fontSize: 10, letterSpacing: 3, fontWeight: "600", textAlign: "center", marginBottom: 6 }}>TECNOLOGÍA AUREA</Text>
        <Text style={styles.blockchainTitulo}>¿Cómo funciona el{"\n"}certificado blockchain?</Text>
        <View style={styles.heroDivider} style={{ width: 40, height: 1, backgroundColor: "#c9a96e", marginBottom: 24, alignSelf: "center" }} />

        {[
          { paso: "01", titulo: "Realizas tu compra", desc: "Seleccionas tu prenda y completas el pedido en Aurea.", icon: "🛒" },
          { paso: "02", titulo: "Se genera el certificado", desc: "Nuestro sistema crea un certificado único e irrepetible para tu prenda.", icon: "📜" },
          { paso: "03", titulo: "Se registra en blockchain", desc: "El certificado se graba permanentemente en la red Ethereum Sepolia.", icon: "🔗" },
          { paso: "04", titulo: "Verificación pública", desc: "Cualquier persona puede verificar la autenticidad de tu prenda con el hash.", icon: "🛡" },
        ].map((item) => (
          <View key={item.paso} style={styles.pasoRow}>
            <View style={styles.pasoIconContainer}>
              <Text style={styles.pasoIcon}>{item.icon}</Text>
            </View>
            <View style={styles.pasoInfo}>
              <View style={styles.pasoHeader}>
                <Text style={styles.pasoNumero}>{item.paso}</Text>
                <Text style={styles.pasoTitulo}>{item.titulo}</Text>
              </View>
              <Text style={styles.pasoDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.blockchainFooter}>
          <Text style={styles.blockchainFooterText}>
            Powered by Ethereum · Red Sepolia
          </Text>
        </View>
      </View>

      {/* CUENTA BANNER si no está logueado */}
      {!cliente && (
        <View style={styles.cuentaBanner}>
          <Text style={styles.cuentaTitulo}>Únete a Aurea</Text>
          <Text style={styles.cuentaDesc}>Crea tu cuenta y lleva el seguimiento de tus piezas y certificados.</Text>
          <TouchableOpacity style={styles.cuentaBtn} onPress={() => navigation.navigate("PerfilTab")}>
            <Text style={styles.cuentaBtnText}>CREAR CUENTA</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf9f7" },

  // Hero
  hero: { width: "100%", height: height * 0.78 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 28, paddingBottom: 48 },
  heroEtiqueta: { color: "#c9a96e", fontSize: 11, letterSpacing: 3, fontWeight: "600", marginBottom: 14 },
  heroTitulo: { color: "#fff", fontSize: 38, fontWeight: "700", lineHeight: 46, marginBottom: 16 },
  heroDivider: { width: 40, height: 1, backgroundColor: "#c9a96e", marginBottom: 16 },
  heroDesc: { color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 22, marginBottom: 28 },
  heroBtnPrimary: { backgroundColor: "#fff", paddingVertical: 14, paddingHorizontal: 24, alignSelf: "flex-start", marginBottom: 12 },
  heroBtnPrimaryText: { color: "#1c1c1c", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  heroBtnOutline: { borderWidth: 1, borderColor: "#fff", paddingVertical: 14, paddingHorizontal: 24, alignSelf: "flex-start" },
  heroBtnOutlineText: { color: "#fff", fontSize: 12, fontWeight: "600", letterSpacing: 2 },

  // Oferta banner
  ofertaBanner: {
    flexDirection: "row", margin: 20, borderRadius: 16,
    backgroundColor: "#1c1c1c", overflow: "hidden",
  },
  ofertaLeft: { flex: 1, padding: 20 },
  ofertaEtiqueta: { color: "#c9a96e", fontSize: 9, letterSpacing: 2, fontWeight: "700", marginBottom: 6 },
  ofertaTitulo: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  ofertaDesc: { color: "#999", fontSize: 12, lineHeight: 18, marginBottom: 16 },
  ofertaBtn: { backgroundColor: "#c9a96e", paddingVertical: 8, paddingHorizontal: 14, alignSelf: "flex-start", borderRadius: 4 },
  ofertaBtnText: { color: "#1c1c1c", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  ofertaRight: { width: 80, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(201,169,110,0.15)", padding: 12 },
ofertaPorcentaje: { color: "#c9a96e", fontSize: 24, fontWeight: "800" },
ofertaDscto: { color: "#c9a96e", fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },

  // Secciones
  section: { padding: 28 },
  sectionEtiqueta: { color: "#c9a96e", fontSize: 10, letterSpacing: 3, fontWeight: "600", marginBottom: 6 },
  sectionTitulo: { fontSize: 22, fontWeight: "700", color: "#1c1c1c", marginBottom: 20 },

  // Universos
  universosRow: { flexDirection: "row", gap: 12 },
  universoCard: { flex: 1, backgroundColor: "#f0ece6", borderRadius: 12, paddingVertical: 20, alignItems: "center", gap: 8 },
  universoEmoji: { fontSize: 28 },
  universoLabel: { fontSize: 12, fontWeight: "600", color: "#1c1c1c", letterSpacing: 0.5 },

  // Productos
  productoCard: { width: 160, marginRight: 16 },
  productoImagen: { width: 160, height: 210, borderRadius: 8, backgroundColor: "#f0ece6", marginBottom: 10 },
  productoPlaceholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 36, color: "#999", fontWeight: "700" },
  productoCategoria: { fontSize: 9, color: "#c9a96e", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  productoNombre: { fontSize: 13, fontWeight: "600", color: "#1c1c1c", marginBottom: 6, lineHeight: 18 },
  productoPrecio: { fontSize: 14, fontWeight: "700", color: "#1c1c1c" },

  // Blockchain
  blockchainSection: { backgroundColor: "#1c1c1c", margin: 20, borderRadius: 20, padding: 28 },
  blockchainTitulo: { color: "#fff", fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 30, marginBottom: 24 },
  pasoRow: { flexDirection: "row", gap: 16, marginBottom: 20 },
  pasoIconContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(201,169,110,0.15)", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  pasoIcon: { fontSize: 20 },
  pasoInfo: { flex: 1 },
  pasoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  pasoNumero: { color: "#c9a96e", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  pasoTitulo: { color: "#fff", fontSize: 14, fontWeight: "700" },
  pasoDesc: { color: "#999", fontSize: 12, lineHeight: 18 },
  blockchainFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 16, marginTop: 8, alignItems: "center" },
  blockchainFooterText: { color: "#555", fontSize: 11, letterSpacing: 1 },

  // Cuenta banner
  cuentaBanner: { margin: 20, marginTop: 0, padding: 24, backgroundColor: "#f0ece6", borderRadius: 16, alignItems: "center" },
  cuentaTitulo: { fontSize: 18, fontWeight: "700", color: "#1c1c1c", marginBottom: 8 },
  cuentaDesc: { fontSize: 13, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  cuentaBtn: { backgroundColor: "#1c1c1c", paddingVertical: 12, paddingHorizontal: 24 },
  cuentaBtnText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 2 },
});