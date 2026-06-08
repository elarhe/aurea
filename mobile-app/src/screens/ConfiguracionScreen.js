import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from "react-native";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ConfiguracionScreen() {
  const { cliente, logout, actualizarCliente } = useAuth();

  const [seccion, setSeccion] = useState(null);
  const [firstName, setFirstName] = useState(cliente?.nombre?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(cliente?.nombre?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(cliente?.email || "");
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [idiomaSeleccionado, setIdiomaSeleccionado] = useState(cliente?.preferredLanguage || "es");
  const [cargando, setCargando] = useState(false);

  const idiomaNombre = { es: "Español", en: "English", uk: "Українська" };

  const opciones = [
    { id: "nombre", label: "Nombre y apellido", valor: cliente?.nombre || "—", icon: "👤" },
    { id: "email", label: "Email", valor: cliente?.email || "—", icon: "✉️" },
    { id: "password", label: "Contraseña", valor: "••••••••", icon: "🔒" },
    { id: "idioma", label: "Idioma", valor: idiomaNombre[cliente?.preferredLanguage || "es"], icon: "🌍" },
  ];

  const guardarNombre = async () => {
    if (!firstName.trim()) { Alert.alert("Error", "El nombre no puede estar vacío"); return; }
    setCargando(true);
    try {
      await api.put("/users/me", { firstName: firstName.trim(), lastName: lastName.trim() });
      await actualizarCliente({ nombre: `${firstName.trim()} ${lastName.trim()}`.trim() });
      Alert.alert("✓ Guardado", "Nombre actualizado correctamente");
      setSeccion(null);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  };

  const guardarEmail = async () => {
    if (!email.trim() || !email.includes("@")) { Alert.alert("Error", "Email no válido"); return; }
    setCargando(true);
    try {
      await api.put("/users/me", { email: email.trim().toLowerCase() });
      await actualizarCliente({ email: email.trim().toLowerCase() });
      Alert.alert("✓ Guardado", "Email actualizado correctamente");
      setSeccion(null);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  };

  const guardarPassword = async () => {
    if (!passwordActual || !passwordNueva) { Alert.alert("Error", "Rellena todos los campos"); return; }
    if (passwordNueva.length < 8) { Alert.alert("Error", "La nueva contraseña debe tener al menos 8 caracteres"); return; }
    if (passwordNueva !== passwordConfirmar) { Alert.alert("Error", "Las contraseñas no coinciden"); return; }
    setCargando(true);
    try {
      await api.patch("/users/password", { passwordActual, nuevaPassword: passwordNueva });
      Alert.alert("✓ Guardado", "Contraseña actualizada correctamente");
      setPasswordActual(""); setPasswordNueva(""); setPasswordConfirmar("");
      setSeccion(null);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || "Contraseña actual incorrecta");
    } finally {
      setCargando(false);
    }
  };

  const guardarIdioma = async () => {
    setCargando(true);
    try {
      await api.put("/users/me", { preferredLanguage: idiomaSeleccionado });
      await actualizarCliente({ preferredLanguage: idiomaSeleccionado });
      Alert.alert("✓ Guardado", "Idioma actualizado correctamente");
      setSeccion(null);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.mensaje || "No se pudo guardar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      <View style={styles.seccionCard}>
        {opciones.map((op, i) => (
          <TouchableOpacity
            key={op.id}
            style={[styles.opcion, i < opciones.length - 1 && styles.opcionBorder]}
            onPress={() => setSeccion(seccion === op.id ? null : op.id)}
          >
            <Text style={styles.opcionIcon}>{op.icon}</Text>
            <View style={styles.opcionInfo}>
              <Text style={styles.opcionLabel}>{op.label}</Text>
              <Text style={styles.opcionValor} numberOfLines={1}>{op.valor}</Text>
            </View>
            <Text style={styles.opcionArrow}>{seccion === op.id ? "∨" : "›"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nombre */}
      {seccion === "nombre" && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Cambiar nombre</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NOMBRE</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Tu nombre" placeholderTextColor="#bbb" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>APELLIDO</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Tu apellido" placeholderTextColor="#bbb" />
          </View>
          <TouchableOpacity style={[styles.btn, cargando && styles.btnDisabled]} onPress={guardarNombre} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>GUARDAR</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Email */}
      {seccion === "email" && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Cambiar email</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NUEVO EMAIL</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" />
          </View>
          <TouchableOpacity style={[styles.btn, cargando && styles.btnDisabled]} onPress={guardarEmail} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>GUARDAR</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Contraseña */}
      {seccion === "password" && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Cambiar contraseña</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONTRASEÑA ACTUAL</Text>
            <TextInput style={styles.input} value={passwordActual} onChangeText={setPasswordActual} placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
            <TextInput style={styles.input} value={passwordNueva} onChangeText={setPasswordNueva} placeholder="Mínimo 8 caracteres" placeholderTextColor="#bbb" secureTextEntry />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
            <TextInput style={styles.input} value={passwordConfirmar} onChangeText={setPasswordConfirmar} placeholder="Repite la contraseña" placeholderTextColor="#bbb" secureTextEntry />
          </View>
          <TouchableOpacity style={[styles.btn, cargando && styles.btnDisabled]} onPress={guardarPassword} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>GUARDAR</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Idioma */}
      {seccion === "idioma" && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Idioma de la app</Text>
          {[
            { val: "es", label: "🇪🇸  Español" },
            { val: "en", label: "🇬🇧  English" },
            { val: "uk", label: "🇺🇦  Українська" },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.val}
              style={[styles.idiomaOpcion, idiomaSeleccionado === lang.val && styles.idiomaOpcionSelected]}
              onPress={() => setIdiomaSeleccionado(lang.val)}
            >
              <Text style={[styles.idiomaLabel, idiomaSeleccionado === lang.val && styles.idiomaLabelSelected]}>
                {lang.label}
              </Text>
              {idiomaSeleccionado === lang.val && (
                <Text style={styles.idiomaCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.btn, { marginTop: 16 }, cargando && styles.btnDisabled]} onPress={guardarIdioma} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>GUARDAR</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => Alert.alert("Cerrar sesión", "¿Seguro que quieres cerrar sesión?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Cerrar sesión", style: "destructive", onPress: logout },
        ])}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  seccionCard: { margin: 16, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  opcion: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  opcionBorder: { borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  opcionIcon: { fontSize: 20, width: 28, textAlign: "center" },
  opcionInfo: { flex: 1 },
  opcionLabel: { fontSize: 14, fontWeight: "600", color: "#1c1c1c", marginBottom: 2 },
  opcionValor: { fontSize: 12, color: "#999" },
  opcionArrow: { fontSize: 18, color: "#ccc" },
  form: { marginHorizontal: 16, marginBottom: 8, backgroundColor: "#fff", borderRadius: 12, padding: 20 },
  formTitle: { fontSize: 16, fontWeight: "700", color: "#1c1c1c", marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, color: "#999", letterSpacing: 1.5, marginBottom: 8, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: "#1c1c1c", backgroundColor: "#faf9f7" },
  btn: { backgroundColor: "#1c1c1c", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  idiomaOpcion: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 10, marginBottom: 8, backgroundColor: "#faf9f7" },
  idiomaOpcionSelected: { borderColor: "#1c1c1c", backgroundColor: "#f0ece6" },
  idiomaLabel: { fontSize: 15, color: "#666" },
  idiomaLabelSelected: { color: "#1c1c1c", fontWeight: "600" },
  idiomaCheck: { color: "#c9a96e", fontSize: 18, fontWeight: "700" },
  logoutBtn: { margin: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },
});