import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [cliente, setCliente] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar, verificar sesión existente
  useEffect(() => {
    const storedToken = localStorage.getItem("aurea_token_cliente");
    if (!storedToken) {
      setCargando(false);
      return;
    }
    setToken(storedToken);
    authService
      .me()
      .then((data) => {
        const user = data.user || data;
        setCliente(user);
        localStorage.setItem("aurea_cliente", JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem("aurea_token_cliente");
        localStorage.removeItem("aurea_cliente");
        setToken(null);
        setCliente(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const login = (usuario, tok) => {
    setCliente(usuario);
    setToken(tok);
    localStorage.setItem("aurea_token_cliente", tok);
    localStorage.setItem("aurea_cliente", JSON.stringify(usuario));
  };

  const logout = () => {
    setCliente(null);
    setToken(null);
    localStorage.removeItem("aurea_token_cliente");
    localStorage.removeItem("aurea_cliente");
  };

  return (
    <AuthContext.Provider value={{ cliente, token, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
