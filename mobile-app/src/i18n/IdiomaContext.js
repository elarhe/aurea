import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations } from "./translations";

const IdiomaContext = createContext(null);

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    global.aureaLang = "es"; // inicializar inmediatamente
    return "es";
  });

  useEffect(() => {
    AsyncStorage.getItem("aurea_lang").then((guardado) => {
      const lang = guardado && translations[guardado] ? guardado : "es";
      global.aureaLang = lang;
      setIdioma(lang);
    });
  }, []);

  const t = translations[idioma] || translations.es;

  const cambiarIdioma = (nuevoIdioma) => {
    if (translations[nuevoIdioma]) {
      global.aureaLang = nuevoIdioma;
      setIdioma(nuevoIdioma);
      AsyncStorage.setItem("aurea_lang", nuevoIdioma);
    }
  };

  return (
    <IdiomaContext.Provider value={{ idioma, t, cambiarIdioma }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export const useIdioma = () => useContext(IdiomaContext);