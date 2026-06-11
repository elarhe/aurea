import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Linking, Modal, Pressable,
  RefreshControl, ScrollView,
} from "react-native";
import { certificadosService } from "../services/api";

// ── Colores de estado del certificado ────────────────────────────────────────
const estadoConfig = {
  issued:  { bg: "#dcfce7", text: "#166534", label: "Emitido",   emoji: "✅" },
  pending: { bg: "#fef9c3", text: "#854d0e", label: "Pendiente", emoji: "⏳" },
  failed:  { bg: "#fee2e2", text: "#991b1b", label: "Fallido",   emoji: "❌" },
  revoked: { bg: "#fee2e2", text: "#991b1b", label: "Revocado",  emoji: "🚫" },
};

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function truncate(str, n = 20) {
  if (!str) return "—";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

// ── Tarjeta de certificado ────────────────────────────────────────────────────
function CertCard({ cert, onPress, expandido }) {
  const estado = cert.status || "pending";
  const cfg = estadoConfig[estado] || estadoConfig.pending;
  const producto = cert.product?.name || cert.productName || "Producto";
  const fecha = formatFecha(cert.issuedAt || cert.createdAt);
  const serial = cert.serialNumber || "—";
  const txHash = cert.transactionHash;

  return (
    <View style={styles.card}>
      {/* Cabecera */}
      <TouchableOpacity style={styles.cardHeader} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardProducto} numberOfLines={2}>{producto}</Text>
          <Text style={styles.cardFecha}>{fecha}</Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.text }]}>
              {cfg.emoji} {cfg.label}
            </Text>
          </View>
          <Text style={styles.expandArrow}>{expandido ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {/* Serial visible siempre */}
      <View style={styles.serialRow}>
        <Text style={styles.serialLabel}>Serie</Text>
        <Text style={styles.serialValue}>{truncate(serial, 28)}</Text>
      </View>

      {/* Detalle expandible */}
      {expandido && (
        <View style={styles.detalle}>
          <View style={styles.detalleRow}>
            <Text style={styles.detalleLabel}>ID on-chain</Text>
            <Text style={styles.detalleValue}>{cert.certificateId ?? "—"}</Text>
          </View>

          {txHash && txHash !== "pending" && (
            <View style={styles.detalleRow}>
              <Text style={styles.detalleLabel}>Tx Hash</Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(`https://sepolia.etherscan.io/tx/${txHash}`)
                }
              >
                <Text style={[styles.detalleValue, styles.link]}>
                  {truncate(txHash, 24)}
                </Text>
                <Text style={styles.linkHint}>↗ Ver en Etherscan</Text>
              </TouchableOpacity>
            </View>
          )}

          {cert.blockNumber && (
            <View style={styles.detalleRow}>
              <Text style={styles.detalleLabel}>Bloque</Text>
              <Text style={styles.detalleValue}>#{cert.blockNumber}</Text>
            </View>
          )}

          {cert.ownerAddress && (
            <View style={styles.detalleRow}>
              <Text style={styles.detalleLabel}>Propietario</Text>
              <Text style={styles.detalleValue}>{truncate(cert.ownerAddress, 22)}</Text>
            </View>
          )}

          {cert.productSnapshot?.materials?.length > 0 && (
            <View style={styles.detalleRow}>
              <Text style={styles.detalleLabel}>Materiales</Text>
              <Text style={styles.detalleValue}>
                {cert.productSnapshot.materials.join(", ")}
              </Text>
            </View>
          )}

          {cert.publicSlug && (
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() =>
                Linking.openURL(
                  `https://sepolia.etherscan.io/tx/${txHash}`
                )
              }
            >
              <Text style={styles.verifyBtnText}>🔍 Verificar autenticidad</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ── Modal de verificación manual ─────────────────────────────────────────────
function VerificarModal({ visible, onClose }) {
  const [input, setInput] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const verificar = async () => {
    const slug = input.trim();
    if (!slug) return;
    setCargando(true);
    setError("");
    setResultado(null);
    try {
      const res = await certificadosService.verificar(slug);
      setResultado(res.data);
    } catch (e) {
      setError(
        e.response?.data?.mensaje || "Certificado no encontrado o error de red"
      );
    } finally {
      setCargando(false);
    }
  };

  const reset = () => {
    setInput("");
    setResultado(null);
    setError("");
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Verificar certificado</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalDesc}>
            Introduce el número de serie, el slug público o el hash de transacción
            para verificar la autenticidad de un certificado Aurea.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej: AUREA-2024-A3F2B1C9 o 0x..."
            placeholderTextColor="#aaa"
            value={input}
            onChangeText={setInput}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.verificarBtn, cargando && { opacity: 0.6 }]}
            onPress={verificar}
            disabled={cargando}
          >
            {cargando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.verificarBtnText}>VERIFICAR</Text>}
          </TouchableOpacity>

          {error !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ {error}</Text>
            </View>
          )}

          {resultado && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>
                {resultado.verified ? "✅ Certificado auténtico" : "⚠️ Datos verificados offline"}
              </Text>
              <Text style={styles.resultItem}>
                <Text style={styles.resultLabel}>Producto: </Text>
                {resultado.certificado?.productName || "—"}
              </Text>
              <Text style={styles.resultItem}>
                <Text style={styles.resultLabel}>Serie: </Text>
                {resultado.certificado?.serialNumber || "—"}
              </Text>
              <Text style={styles.resultItem}>
                <Text style={styles.resultLabel}>Estado: </Text>
                {resultado.certificado?.status || "—"}
              </Text>
              {resultado.certificado?.transactionHash &&
                resultado.certificado.transactionHash !== "pending" && (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(
                        `https://sepolia.etherscan.io/tx/${resultado.certificado.transactionHash}`
                      )
                    }
                  >
                    <Text style={[styles.resultItem, styles.link]}>
                      ↗ Ver transacción en Etherscan
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function CertificadosScreen() {
  const [certificados, setCertificados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cargar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setCargando(true);
    try {
      const res = await certificadosService.getMios();
      const data = res.data;
      setCertificados(data.certificados || data.certificates || data.data || []);
    } catch (e) {
      console.log("Error certificados:", e.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const toggleExpandir = (id) =>
    setExpandido((prev) => (prev === id ? null : id));

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#c9a96e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botón verificar */}
      <TouchableOpacity
        style={styles.verificarHeaderBtn}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.verificarHeaderText}>🔍 Verificar un certificado</Text>
      </TouchableOpacity>

      {certificados.length === 0 ? (
        <View style={styles.emptyCentered}>
          <Text style={styles.emptyEmoji}>🏷️</Text>
          <Text style={styles.emptyTitle}>No tienes certificados aún</Text>
          <Text style={styles.emptyDesc}>
            Cada prenda que compres en Aurea genera un certificado de autenticidad
            registrado de forma permanente en la blockchain de Ethereum.
          </Text>
        </View>
      ) : (
        <FlatList
          data={certificados}
          keyExtractor={(c) => c._id || c.id}
          renderItem={({ item }) => (
            <CertCard
              cert={item}
              expandido={expandido === (item._id || item.id)}
              onPress={() => toggleExpandir(item._id || item.id)}
            />
          )}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => cargar(true)}
              tintColor="#c9a96e"
            />
          }
          ListHeaderComponent={
            <Text style={styles.listaHeader}>
              {certificados.length} certificado{certificados.length !== 1 ? "s" : ""} registrado{certificados.length !== 1 ? "s" : ""}
            </Text>
          }
        />
      )}

      <VerificarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#faf9f7" },
  centered:     { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#faf9f7" },
  emptyCentered:{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyEmoji:   { fontSize: 64, marginBottom: 20 },
  emptyTitle:   { fontSize: 20, fontWeight: "700", color: "#1c1c1c", marginBottom: 12, textAlign: "center" },
  emptyDesc:    { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 22 },

  verificarHeaderBtn: {
    margin: 16, marginBottom: 4, backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e0d9ce", padding: 14,
    flexDirection: "row", justifyContent: "center", alignItems: "center",
  },
  verificarHeaderText: { fontSize: 14, fontWeight: "600", color: "#1c1c1c", letterSpacing: 0.5 },

  lista:       { padding: 16, paddingTop: 8 },
  listaHeader: { fontSize: 12, color: "#aaa", marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" },

  card:         { backgroundColor: "#fff", borderRadius: 12, padding: 16, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardHeaderLeft:  { flex: 1, marginRight: 10 },
  cardHeaderRight: { alignItems: "flex-end", gap: 6 },
  cardProducto: { fontSize: 15, fontWeight: "700", color: "#1c1c1c", lineHeight: 20 },
  cardFecha:    { fontSize: 12, color: "#999", marginTop: 3 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:    { fontSize: 12, fontWeight: "600" },
  expandArrow:  { fontSize: 11, color: "#bbb", marginTop: 4 },

  serialRow:    { flexDirection: "row", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  serialLabel:  { fontSize: 11, color: "#aaa", letterSpacing: 0.5, width: 40 },
  serialValue:  { fontSize: 12, color: "#555", fontFamily: "monospace", flex: 1 },

  detalle:      { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0", gap: 10 },
  detalleRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" },
  detalleLabel: { fontSize: 12, color: "#aaa", width: 90 },
  detalleValue: { fontSize: 12, color: "#1c1c1c", flex: 1, textAlign: "right" },
  link:         { color: "#c9a96e", textDecorationLine: "underline" },
  linkHint:     { fontSize: 10, color: "#c9a96e", textAlign: "right", marginTop: 2 },

  verifyBtn:    { marginTop: 8, backgroundColor: "#faf9f7", borderWidth: 1, borderColor: "#e0d9ce", padding: 10, alignItems: "center" },
  verifyBtnText:{ fontSize: 12, fontWeight: "600", color: "#1c1c1c", letterSpacing: 1 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  modalTitle:   { fontSize: 18, fontWeight: "700", color: "#1c1c1c" },
  modalClose:   { fontSize: 20, color: "#999", padding: 4 },
  modalBody:    { flex: 1, padding: 20 },
  modalDesc:    { fontSize: 14, color: "#888", lineHeight: 22, marginBottom: 20 },

  input:        { borderWidth: 1, borderColor: "#e0e0e0", padding: 14, fontSize: 14, color: "#1c1c1c", backgroundColor: "#faf9f7", marginBottom: 14, letterSpacing: 0.5 },
  verificarBtn: { backgroundColor: "#1c1c1c", padding: 16, alignItems: "center" },
  verificarBtnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 3 },

  errorBox:     { backgroundColor: "#fee2e2", padding: 14, marginTop: 16 },
  errorText:    { color: "#991b1b", fontSize: 13 },
  resultBox:    { backgroundColor: "#f0fdf4", padding: 16, marginTop: 16, borderWidth: 1, borderColor: "#bbf7d0" },
  resultTitle:  { fontSize: 15, fontWeight: "700", color: "#166534", marginBottom: 12 },
  resultItem:   { fontSize: 13, color: "#1c1c1c", marginBottom: 6 },
  resultLabel:  { fontWeight: "600" },
});
