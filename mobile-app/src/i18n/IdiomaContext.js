import React, { createContext, useContext, useState } from "react";
import { translations } from "./translations";

const IdiomaContext = createContext(null);

export function IdiomaProvider({ children, idiomaInicial = "es" }) {
  const [idioma, setIdioma] = useState(idiomaInicial);

  const t = translations[idioma] || translations.es;

  const cambiarIdioma = (nuevoIdioma) => {
    if (translations[nuevoIdioma]) setIdioma(nuevoIdioma);
  };

  return (
    <IdiomaContext.Provider value={{ idioma, t, cambiarIdioma }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export const useIdioma = () => useContext(IdiomaContext);