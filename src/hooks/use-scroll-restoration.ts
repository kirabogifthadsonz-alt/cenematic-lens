import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Saves and restores window scroll position per pathname using sessionStorage.
 * Use on pages where you want users to return to the exact spot they left.
 */
export function useScrollRestoration(key?: string) {
  const { pathname } = useLocation();
  const storageKey = `scroll:${key ?? pathname}`;

  // Restore on mount / when key changes
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null) {
      const y = parseInt(saved, 10);
      // Wait for content to render before restoring
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        // Second pass for late-loading images shifting layout
        setTimeout(() => window.scrollTo(0, y), 100);
      });
    }
  }, [storageKey]);

  // Save on scroll + before unload
  useEffect(() => {
    let raf = 0;
    const save = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(storageKey, String(window.scrollY));
      });
    };
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("beforeunload", save);
    return () => {
      save();
      window.removeEventListener("scroll", save);
      window.removeEventListener("beforeunload", save);
      cancelAnimationFrame(raf);
    };
  }, [storageKey]);
}
