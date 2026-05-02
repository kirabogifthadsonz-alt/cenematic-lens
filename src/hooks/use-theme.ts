import { useEffect, useState, useCallback } from "react";

export type ThemeName = "yellow" | "red";
const STORAGE_KEY = "cl-color-theme";

export function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "yellow";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "red" || v === "yellow" ? v : "yellow";
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.classList.remove("theme-yellow", "theme-red");
  root.classList.add(`theme-${theme}`);
  root.setAttribute("data-theme", theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);
  const toggle = useCallback(
    () => setThemeState(prev => (prev === "yellow" ? "red" : "yellow")),
    []
  );

  return { theme, setTheme, toggle };
}
