/**
 * Dropbox Link Preloader & Resolver
 *
 * This module handles resolving Dropbox shared links into temporary direct-download links
 * that can be played in <video> elements. It uses:
 *
 * 1. Client-side Supabase Edge Function (dropbox-stream-dual) for most links
 * 2. Cloudflare Worker CDN proxy for old account (if configured)
 * 3. Local caching to avoid redundant API calls
 * 4. Request deduplication for concurrent requests to the same URL
 */

const EDGE_URL = "https://ycnpnhqkbqmvjvgkqnzk.supabase.co/functions/v1/dropbox-stream-dual";
const CF_WORKER_URL = typeof window !== "undefined" && (window as any).__DROPBOX_CDN_WORKER
  ? (window as any).__DROPBOX_CDN_WORKER
  : null;
const CACHE_TTL = 3600000; // 1 hour

interface CacheEntry {
  link: string;
  resolvedAt: number;
}

const cache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Check if a URL is a Dropbox shared link or direct content URL.
 */
export function isDropboxUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("dropbox.com") ||
    lower.includes("dropboxusercontent.com")
  );
}

/**
 * Check if the Cloudflare Worker CDN proxy is available.
 * This is typically configured for the old Dropbox account.
 */
export function hasCdnProxy(): boolean {
  return !!CF_WORKER_URL;
}

/**
 * Build a CDN proxy URL for a Dropbox share URL.
 * The video player uses this URL directly — the Worker resolves + caches at edge.
 */
export function getCdnProxyUrl(dropboxShareUrl: string): string {
  if (!CF_WORKER_URL || !isDropboxUrl(dropboxShareUrl)) return dropboxShareUrl;
  return `${CF_WORKER_URL}?url=${encodeURIComponent(dropboxShareUrl)}`;
}

/** Get a cached resolved link, or null if not cached/expired */
export function getCachedLink(dropboxUrl: string): string | null {
  const entry = cache.get(dropboxUrl);
  if (entry && Date.now() - entry.resolvedAt < CACHE_TTL) return entry.link;
  if (entry) cache.delete(dropboxUrl);
  return null;
}

/** Resolve a single Dropbox URL (uses cache + dedup) */
export async function resolveDropboxUrl(url: string, dropboxAccount: "new" | "old" = "new"): Promise<string> {
  // If CDN proxy is available, use it directly (no need to resolve temp links)
  // ONLY use proxy for the old account since the worker is typically bound to one account
  if (hasCdnProxy() && isDropboxUrl(url) && dropboxAccount === "old") return getCdnProxyUrl(url);

  if (!isDropboxUrl(url)) return url;

  const cached = getCachedLink(url);
  if (cached) return cached;

  // Dedup in-flight requests
  const pending = pendingRequests.get(url);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, dropbox_account: dropboxAccount }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const link = data.link || url;
      cache.set(url, { link, resolvedAt: Date.now() });
      return link;
    } catch {
      return url;
    } finally {
      pendingRequests.delete(url);
    }
  })();

  pendingRequests.set(url, promise);
  return promise;
}

/** Batch-resolve multiple Dropbox URLs in a single API call */
export async function resolveDropboxUrls(urls: string[], dropboxAccount: "new" | "old" = "new"): Promise<string[]> {
  // If CDN proxy is available, just build proxy URLs (no API calls needed)
  // ONLY use proxy for the old account since the worker is typically bound to one account
  if (hasCdnProxy() && dropboxAccount === "old") {
    return urls.map(u => isDropboxUrl(u) ? getCdnProxyUrl(u) : u);
  }

  const dropboxUrls = urls.filter(isDropboxUrl);
  if (dropboxUrls.length === 0) return urls;

  // Check which ones need resolving
  const uncached: string[] = [];
  for (const u of dropboxUrls) {
    if (!getCachedLink(u)) uncached.push(u);
  }

  if (uncached.length > 0) {
    try {
      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: uncached, dropbox_account: dropboxAccount }),
      });
      if (res.ok) {
        const data = await res.json();
        const links: string[] = data.links || [];
        uncached.forEach((u, i) => {
          if (links[i]) cache.set(u, { link: links[i], resolvedAt: Date.now() });
        });
      }
    } catch {}
  }

  // Return resolved URLs in original order
  return urls.map(u => getCachedLink(u) || u);
}

/**
 * Preload Dropbox links for a movie (fire-and-forget).
 * Call this when a movie appears on screen.
 */
export function preloadMovieLinks(movie: {
  video_url?: string | null;
  video_url_720p?: string | null;
  video_url_480p?: string | null;
  dropbox_account?: "new" | "old" | null;
}) {
  // With CDN proxy, no preloading needed — URLs are built instantly
  if (hasCdnProxy()) return;

  const urls = [movie.video_url, movie.video_url_720p, movie.video_url_480p]
    .filter((u): u is string => !!u && isDropboxUrl(u));

  if (urls.length > 0) {
    const account = movie.dropbox_account === "old" ? "old" : "new";
    resolveDropboxUrls(urls, account).catch(() => {});
  }
}

/**
 * Get resolved movie URLs (from cache if preloaded, or resolve now).
 * Returns a new movie object with resolved URLs.
 */
export async function getResolvedMovieUrls<T extends {
  video_url?: string | null;
  video_url_720p?: string | null;
  video_url_480p?: string | null;
  dropbox_account?: "new" | "old" | null;
}>(movie: T): Promise<T> {
  const urls: string[] = [];
  const keys: string[] = [];
  const account = movie.dropbox_account === "old" ? "old" : "new";

  for (const key of ["video_url", "video_url_720p", "video_url_480p"] as const) {
    const val = (movie as any)[key];
    if (val && isDropboxUrl(val)) {
      urls.push(val);
      keys.push(key);
    }
  }

  if (urls.length === 0) return movie;

  const resolved = await resolveDropboxUrls(urls, account);
  const result = { ...movie };
  keys.forEach((key, i) => {
    (result as any)[key] = resolved[i];
  });

  return result;
}
