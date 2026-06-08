import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useIdioma } from "../i18n/IdiomaContext";

export default function PerfilScreen({ navigation }) {
  const { cliente, login, registro, logout } = useAuth();
  const { t } = useIdioma();
  const [tab, setTab] = useState("login");
  const [cargando, setCargando] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ firstName: "", lastName: "", email: "", password: "", gender: "unspecified" });

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { Alert.alert("Error", "Introduce email y contraseña"); return; }
    setCargando(true);
    try { await login(loginForm.email, loginForm.password); }
    catch (e) { Alert.alert("Error", e.response?.data?.mensaje || t.perfil.credencialesError); }
    finally { setCargando(false); }
  };

  const handleRegistro = async () => {
    if (!regForm.firstName || !regForm.email || !regForm.password) { Alert.alert("Error", "Rellena todos los campos obligatorios"); return; }
    if (regForm.password.length < 8) { Alert.alert("Error", t.perfil.minPassword); return; }
    setCargando(true);
    try { await registro(regForm.firstName, regForm.lastName, regForm.email, regForm.password, regForm.gender); }
    catch (e) { Alert.alert("Error", e.response?.data?.mensaje || t.perfil.registroError); }
    finally { setCargando(false); }
  };

  // Usuario logueado
  if (cliente) {
    const inicial = (cliente.nombre || cliente.email || "?")[0].toUpperCase();
    const nombre = cliente.nombre || cliente.email;

    return (
      <ScrollView style={styles.container}>
        {/* Header perfil */}
        <View style={styles.perfilHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <Text style={styles.perfilNombre}>{nombre}</Text>
          <Text style={styles.perfilEmail}>{cliente.email}</Text>
        </View>

        {/* Menú */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Pedidos")}>
            <Text style={styles.menuIcon}>📦</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{t.perfil.misPedidos}</Text>
              <Text style={styles.menuSub}>{t.perfil.historial}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Certificados")}>
            <Text style={styles.menuIcon}>🛡</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{t.perfil.misCertificados}</Text>
              <Text style={styles.menuSub}>{t.perfil.autenticidad}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Configuracion")}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{t.perfil.configuracion}</Text>
              <Text style={styles.menuSub}>{t.perfil.configDesc}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => Alert.alert(t.perfil.cerrarSesion, t.perfil.cerrarSesionConfirm, [
            { text: t.perfil.cancelar, style: "cancel" },
            { text: t.perfil.cerrarSesion, style: "destructive", onPress: logout },
          ])}
        >
          <Text style={styles.logoutText}>{t.perfil.cerrarSesion}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  // Login / Registro
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.authHeader}>
        <Text style={styles.authLogo}>AUREA</Text>
        <Text style={styles.authSubtitle}>{tab === "login" ? t.perfil.bienvenida : t.perfil.crearCuenta}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === "login" && styles.tabActive]} onPress={() => setTab("login")}>
          <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>{t.perfil.iniciarSesion}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "registro" && styles.tabActive]} onPress={() => setTab("registro")}>
          <Text style={[styles.tabText, tab === "registro" && styles.tabTextActive]}>{t.perfil.btnCrear}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {tab === "login" ? (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.perfil.email}</Text>
              <TextInput style={styles.input} value={loginForm.email} onChangeText={(v) => setLoginForm(f => ({ ...f, email: v }))} placeholder="tu@email.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.perfil.password}</Text>
              <TextInput style={styles.input} value={loginForm.password} onChangeText={(v) => setLoginForm(f => ({ ...f, password: v }))} placeholder="••••••••" placeholderTextColor="#bbb" secureTextEntry />
            </View>
            <TouchableOpacity style={[styles.btn, cargando && styles.btnDisabled]} onPress={handleLogin} disabled={cargando}>
              {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.perfil.btnIniciar}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>{t.perfil.nombre} *</Text>
                <TextInput style={styles.input} value={regForm.firstName} onChangeText={(v) => setRegForm(f => ({ ...f, firstName: v }))} placeholder="Ana" placeholderTextColor="#bbb" />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t.perfil.apellido}</Text>
                <TextInput style={styles.input} value={regForm.lastName} onChangeText={(v) => setRegForm(f => ({ ...f, lastName: v }))} placeholder="García" placeholderTextColor="#bbb" />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.perfil.email} *</Text>
              <TextInput style={styles.input} value={regForm.email} onChangeText={(v) => setRegForm(f => ({ ...f, email: v }))} placeholder="tu@email.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.perfil.password} *</Text>
              <TextInput style={styles.input} value={regForm.password} onChangeText={(v) => setRegForm(f => ({ ...f, password: v }))} placeholder={t.perfil.minPassword} placeholderTextColor="#bbb" secureTextEntry />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.perfil.genero}</Text>
              <View style={styles.generoRow}>
                {[
                  { val: "female", label: t.perfil.mujer },
                  { val: "male", label: t.perfil.hombre },
                  { val: "unspecified", label: t.perfil.noDecir },
                ].map((g) => (
                  <TouchableOpacity key={g.val} style={[styles.generoBtn, regForm.gender === g.val && styles.generoBtnSelected]} onPress={() => setRegForm(f => ({ ...f, gender: g.val }))}>
                    <Text style={[styles.generoBtnText, regForm.gender === g.val && styles.generoBtnTextSelected]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.btn, cargando && styles.btnDisabled]} onPress={handleRegistro} disabled={cargando}>
              {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.perfil.btnCrear}</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  perfilHeader: { alignItems: "center", padding: 36, backgroundColor: "#1c1c1c" },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#c9a96e", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#1c1c1c" },
  perfilNombre: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 4 },
  perfilEmail: { fontSize: 13, color: "#999" },
  menuCard: { margin: 16, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuDivider: { height: 1, backgroundColor: "#f0f0f0", marginLeft: 56 },
  menuIcon: { fontSize: 22, width: 28, textAlign: "center" },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#1c1c1c" },
  menuSub: { fontSize: 12, color: "#999", marginTop: 2 },
  menuArrow: { fontSize: 22, color: "#ccc" },
  logoutBtn: { marginHorizontal: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#ef4444", fontSize: 14, fontWeight: "600" },
  authHeader: { alignItems: "center", padding: 40, paddingBottom: 24, backgroundColor: "#fff" },
  authLogo: { fontSize: 28, fontWeight: "700", letterSpacing: 6, color: "#1c1c1c", marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: "#999" },
  tabs: { flexDirection: "row", marginHorizontal: 20, borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 10, overflow: "hidden", marginBottom: 24, marginTop: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: "#fff" },
  tabActive: { backgroundColor: "#1c1c1c" },
  tabText: { fontSize: 13, color: "#999", fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "700" },
  form: { paddingHorizontal: 20 },
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, color: "#999", letterSpacing: 1.5, marginBottom: 8, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: "#1c1c1c", backgroundColor: "#fff" },
  generoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  generoBtn: { paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: "#e5e0d8", borderRadius: 8, backgroundColor: "#fff" },
  generoBtnSelected: { backgroundColor: "#1c1c1c", borderColor: "#1c1c1c" },
  generoBtnText: { fontSize: 12, color: "#666" },
  generoBtnTextSelected: { color: "#fff", fontWeight: "600" },
  btn: { backgroundColor: "#1c1c1c", borderRadius: 10, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
