import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeColor = "red" | "yellow";

interface ThemeContextValue {
  theme: ThemeColor;
  setTheme: (t: ThemeColor) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "cl_theme_color";

function applyTheme(t: ThemeColor) {
  const root = document.documentElement;
  root.classList.remove("theme-red", "theme-yellow");
  root.classList.add(`theme-${t}`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>(() => {
    if (typeof window === "undefined") return "red";
    return ((localStorage.getItem(STORAGE_KEY) as ThemeColor) || "red");
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = (t: ThemeColor) => setThemeState(t);
  const toggleTheme = () => setThemeState((p) => (p === "red" ? "yellow" : "red"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
