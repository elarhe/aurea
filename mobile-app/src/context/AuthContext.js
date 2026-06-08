import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem("aurea_token");
      const clienteGuardado = await AsyncStorage.getItem("aurea_cliente");
      if (token && clienteGuardado) {
        global.aureaToken = token;
        setCliente(JSON.parse(clienteGuardado));
      }
    } catch (e) {
      console.log("Error cargando sesión:", e);
    } finally {
      setCargando(false);
    }
  };

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token, usuario } = res.data;
    global.aureaToken = token;
    await AsyncStorage.setItem("aurea_token", token);
    await AsyncStorage.setItem("aurea_cliente", JSON.stringify(usuario));
    setCliente(usuario);
    return usuario;
  };

  const registro = async (firstName, lastName, email, password, gender) => {
    const res = await authService.registro(firstName, lastName, email, password, gender);
    const { token, usuario } = res.data;
    global.aureaToken = token;
    await AsyncStorage.setItem("aurea_token", token);
    await AsyncStorage.setItem("aurea_cliente", JSON.stringify(usuario));
    setCliente(usuario);
    return usuario;
  };

  const logout = async () => {
    global.aureaToken = null;
    await AsyncStorage.removeItem("aurea_token");
    await AsyncStorage.removeItem("aurea_cliente");
    setCliente(null);
  };

  // Actualiza el estado local del cliente sin necesidad de hacer login de nuevo
  const actualizarCliente = async (datos) => {
    const clienteActualizado = { ...cliente, ...datos };
    await AsyncStorage.setItem("aurea_cliente", JSON.stringify(clienteActualizado));
    setCliente(clienteActualizado);
  };

  return (
    <AuthContext.Provider value={{ cliente, login, registro, logout, cargando, actualizarCliente }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);