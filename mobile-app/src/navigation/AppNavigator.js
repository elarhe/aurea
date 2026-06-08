import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/HomeScreen";
import CatalogoScreen from "../screens/CatalogoScreen";
import ProductoScreen from "../screens/ProductoScreen";
import PerfilScreen from "../screens/PerfilScreen";
import CarritoScreen from "../screens/CarritoScreen";
import PedidosScreen from "../screens/PedidosScreen";
import ConfiguracionScreen from "../screens/ConfiguracionScreen";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";
import { useIdioma } from "../i18n/IdiomaContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const HEADER_OPTS = { headerStyle: { backgroundColor: "#fff", elevation: 0, shadowOpacity: 0 }, headerTintColor: "#1c1c1c", headerTitleStyle: { fontWeight: "700" } };

function UserHeaderBtn({ navigation }) {
  const { cliente } = useAuth();
  return (
    <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("PerfilTab")}>
      {cliente ? <View style={styles.avatarSmall}><Text style={styles.avatarSmallText}>{(cliente.nombre || cliente.email || "?")[0].toUpperCase()}</Text></View> : <Text style={{ fontSize: 22 }}>👤</Text>}
    </TouchableOpacity>
  );
}

function CarritoIcon({ focused }) {
  const { totalItems } = useCarrito();
  return (
    <View>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>🛒</Text>
      {totalItems > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{totalItems > 9 ? "9+" : totalItems}</Text></View>}
    </View>
  );
}

function HomeStack({ navigation: tabNav }) {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Inicio" component={HomeScreen} options={{ title: "AUREA", headerTitleStyle: { letterSpacing: 6, fontWeight: "700", fontSize: 17 }, headerRight: () => <UserHeaderBtn navigation={tabNav} /> }} />
      <Stack.Screen name="Producto" component={ProductoScreen} options={({ route }) => ({ title: route.params?.producto?.name || "Producto" })} />
    </Stack.Navigator>
  );
}

function CatalogoStack() {
  const { t } = useIdioma();
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Catalogo" component={CatalogoScreen} options={{ title: t.nav.tienda }} />
      <Stack.Screen name="Producto" component={ProductoScreen} options={({ route }) => ({ title: route.params?.producto?.name || "Producto" })} />
    </Stack.Navigator>
  );
}

function CarritoStack() {
  const { t } = useIdioma();
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Cesta" component={CarritoScreen} options={{ title: t.carrito.titulo }} />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  const { t } = useIdioma();
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="MiCuenta" component={PerfilScreen} options={{ title: t.perfil.miCuenta }} />
      <Stack.Screen name="Pedidos" component={PedidosScreen} options={{ title: t.pedidos.titulo }} />
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} options={{ title: t.config.titulo }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { t } = useIdioma();
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: "#1c1c1c", tabBarInactiveTintColor: "#999", tabBarLabelStyle: styles.tabLabel, tabBarIcon: ({ focused }) => { if (route.name === "HomeTab") return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>🏠</Text>; if (route.name === "CatalogoTab") return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>🧥</Text>; if (route.name === "CarritoTab") return <CarritoIcon focused={focused} />; if (route.name === "PerfilTab") return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>👤</Text>; } })}>
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: t.nav.inicio }} />
        <Tab.Screen name="CatalogoTab" component={CatalogoStack} options={{ title: t.nav.tienda }} />
        <Tab.Screen name="CarritoTab" component={CarritoStack} options={{ title: t.nav.cesta }} />
        <Tab.Screen name="PerfilTab" component={PerfilStack} options={{ title: t.nav.perfil }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingBottom: 10, paddingTop: 8, height: 68, elevation: 0, shadowOpacity: 0 },
  tabLabel: { fontSize: 10, fontWeight: "500", marginTop: 2 },
  headerBtn: { marginRight: 16, padding: 4 },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#c9a96e", justifyContent: "center", alignItems: "center" },
  avatarSmallText: { fontSize: 12, fontWeight: "700", color: "#1c1c1c" },
  badge: { position: "absolute", top: -4, right: -8, backgroundColor: "#c9a96e", borderRadius: 10, minWidth: 18, height: 18, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { color: "#1c1c1c", fontSize: 10, fontWeight: "700" },
});