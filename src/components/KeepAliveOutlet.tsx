import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

interface KeepAliveRoute {
  path: string; // exact path match (no params)
  element: ReactNode;
}

interface Props {
  routes: KeepAliveRoute[];
  /** Render this when the current route is NOT in `routes` (handled elsewhere). */
  fallback?: ReactNode;
}

/**
 * Mounts each route's element ONCE on first visit, then keeps it alive in the
 * DOM and only toggles `display`. This makes navigation instant (no remount,
 * no refetch, scroll position preserved) — exactly like a native app's tab
 * stack. Routes not listed here render through the normal <Routes> and unmount
 * as usual.
 */
export default function KeepAliveOutlet({ routes, fallback = null }: Props) {
  const location = useLocation();
  const matchedPath = routes.find((r) => r.path === location.pathname)?.path;
  const [mounted, setMounted] = useState<Set<string>>(
    () => new Set(matchedPath ? [matchedPath] : []),
  );
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const previousPath = useRef<string | null>(matchedPath ?? null);

  // Save scroll of outgoing keep-alive page, restore scroll of incoming one.
  useEffect(() => {
    if (previousPath.current && previousPath.current !== matchedPath) {
      scrollPositions.current.set(previousPath.current, window.scrollY);
    }
    if (matchedPath) {
      if (!mounted.has(matchedPath)) {
        setMounted((prev) => new Set(prev).add(matchedPath));
      }
      // Restore scroll on next frame so the DOM is visible first.
      const saved = scrollPositions.current.get(matchedPath) ?? 0;
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
    }
    previousPath.current = matchedPath ?? null;
  }, [matchedPath, mounted]);

  if (!matchedPath) return <>{fallback}</>;

  return (
    <>
      {routes.map((r) =>
        mounted.has(r.path) ? (
          <div
            key={r.path}
            style={{ display: r.path === matchedPath ? "block" : "none" }}
            aria-hidden={r.path !== matchedPath}
          >
            {r.element}
          </div>
        ) : null,
      )}
    </>
  );
}
