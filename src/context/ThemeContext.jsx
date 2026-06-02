/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Lee la preferencia guardada; por defecto oscuro
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("pisst_theme");
    return saved ? saved === "dark" : true;
  });

  // Persiste cada cambio
  useEffect(() => {
    localStorage.setItem("pisst_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((d) => !d);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}