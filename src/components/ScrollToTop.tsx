import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Pages that are kept alive in the DOM by KeepAliveOutlet — their scroll is
// restored by KeepAlive itself, so we must NOT scroll them to top here.
const KEEP_ALIVE_PATHS = new Set([
  "/home",
  "/vjs",
  "/browse",
  "/new",
  "/my-list",
  "/profile",
  "/wallet",
]);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    prevPath.current = pathname;
    // Leave keep-alive pages alone — KeepAliveOutlet restores their scroll.
    if (KEEP_ALIVE_PATHS.has(pathname)) return;
    // Dynamic pages (e.g. /watch/:id) → top of page.
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
