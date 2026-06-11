/**
 * Devuelve el nombre o descripción de un producto en el idioma activo.
 * Busca primero en producto.translations[lang], luego en los campos legacy
 * (name_en, description_en, name_uk, description_uk), y finalmente en español.
 *
 * @param {Object} producto  - Objeto producto de la API
 * @param {"name"|"description"} campo - Campo a obtener
 * @param {string} lang - Código de idioma ("es", "en", "uk", etc.)
 * @returns {string}
 */
export function getProductoTexto(producto, campo, lang = "es") {
  if (!producto) return "";
  if (lang === "es") {
    return producto.name || producto.nombre || producto.description || producto.descripcion || "";
  }

  // 1. Nuevo campo translations (mapa dinámico)
  if (producto.translations) {
    const t = typeof producto.translations.get === "function"
      ? producto.translations.get(lang)
      : producto.translations[lang];
    if (t && t[campo]) return t[campo];
  }

  // 2. Legacy fields (name_en, description_en, name_uk, description_uk)
  const legacyKey = campo === "name" ? `name_${lang}` : `description_${lang}`;
  if (producto[legacyKey]) return producto[legacyKey];

  // 3. Fallback a español
  if (campo === "name") return producto.name || producto.nombre || "";
  return producto.description || producto.descripcion || "";
}
