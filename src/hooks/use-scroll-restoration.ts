import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Saves and restores window scroll position per pathname using sessionStorage.
 * Use on pages where you want users to return to the exact spot they left.
 */
export function useScrollRestoration(key?: string) {
  const { pathname } = useLocation();
  const storageKey = `scroll:${key ?? pathname}`;

  // Restore on mount / when key changes. Retry until content has loaded
  // enough that the document is tall enough to honor the saved offset.
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved === null) return;
    const y = parseInt(saved, 10);
    if (!Number.isFinite(y) || y <= 0) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 60; // ~3s at 50ms intervals

    const tryRestore = () => {
      if (cancelled) return;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= y) {
        window.scrollTo(0, y);
        // One more pass after late layout shifts
        setTimeout(() => !cancelled && window.scrollTo(0, y), 150);
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        setTimeout(tryRestore, 50);
      } else {
        // Give up gracefully — scroll as far as we can
        window.scrollTo(0, maxScroll);
      }
    };

    requestAnimationFrame(tryRestore);
    return () => {
      cancelled = true;
    };
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
