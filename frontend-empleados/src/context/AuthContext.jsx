import { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [empleado, setEmpleado] = useState(() => {
    try {
      const guardado = localStorage.getItem("aurea_empleado");
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [cargando, setCargando] = useState(true);

  // Verificar token al iniciar
  useEffect(() => {
    const token = localStorage.getItem("aurea_token");
    if (!token) {
      setCargando(false);
      return;
    }
    authService.me()
      .then((res) => setEmpleado(res.data.usuario))
      .catch(() => {
        localStorage.removeItem("aurea_token");
        localStorage.removeItem("aurea_empleado");
        setEmpleado(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { token, empleado: emp } = res.data;
    localStorage.setItem("aurea_token", token);
    localStorage.setItem("aurea_empleado", JSON.stringify(emp));
    setEmpleado(emp);
    return emp;
  };

  const logout = () => {
    localStorage.removeItem("aurea_token");
    localStorage.removeItem("aurea_empleado");
    setEmpleado(null);
  };

  return (
    <AuthContext.Provider value={{ empleado, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);