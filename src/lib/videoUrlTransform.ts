/**
 * Transform cloud storage sharing URLs into direct playable video URLs.
 * Supports: Dropbox, TeraBox, Google Drive, OneDrive
 */

export function transformVideoUrl(url: string): string {
  if (!url) return url;

  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();

    // ── Dropbox ──
    if (h.includes("dropbox.com")) {
      // For /scl/ links, changing dl=0 to raw=1 is the most reliable way to get a direct stream
      if (u.pathname.includes("/scl/")) {
        u.searchParams.set("raw", "1");
        return u.toString();
      }
      if (u.pathname.startsWith("/s/") || u.pathname.startsWith("/sh/")) {
        u.hostname = "dl.dropboxusercontent.com";
        u.searchParams.delete("dl");
        return u.toString();
      }
      u.searchParams.set("dl", "1");
      return u.toString();
    }

    // Already a direct dropbox content URL
    if (h.includes("dropboxusercontent.com")) {
      // If it's a temporary link from get_temporary_link, it might have expired.
      // However, we can't re-resolve it here without the original shared URL.
      // But we CAN ensure it has the right parameters if it's a /scl/ style direct link.
      return url;
    }

    // ── Google Drive ──
    if (h.includes("drive.google.com")) {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (match) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }

    // ── OneDrive / SharePoint ──
    if (h.includes("1drv.ms") || h.includes("onedrive.live.com") || h.includes("sharepoint.com")) {
      u.searchParams.set("download", "1");
      return u.toString();
    }

    // ── TeraBox ──
    if (h.includes("terabox.com") || h.includes("terabox.app") || h.includes("teraboxapp.com") || h.includes("1024terabox.com") || h.includes("1024tera.com")) {
      if (h.match(/^d\d*\./) && h.includes("terabox")) {
        return url;
      }
      return url;
    }

    // ── pCloud ──
    // Public share links: https://u.pcloud.link/publink/show?code=XXXX
    // or https://my.pcloud.com/publink/show?code=XXXX
    // Direct download is served via the publink with &download=1, which 302s to a CDN URL.
    if (h.includes("pcloud.link") || h.includes("pcloud.com")) {
      if (u.pathname.includes("/publink/show") || u.pathname.includes("/publink/")) {
        u.searchParams.set("download", "1");
        return u.toString();
      }
      return url;
    }

    // ── MediaFire ──
    if (h.includes("mediafire.com")) {
      return url; // iframe fallback
    }

    // ── Mega ──
    if (h.includes("mega.nz") || h.includes("mega.co.nz")) {
      return url; // iframe fallback
    }

    // ── Telegram ──
    if (h === "t.me" || h === "telegram.me") {
      return url; // iframe embed
    }

  } catch {
    // Invalid URL — return as-is
  }

  return url;
}

/**
 * Detect the likely MIME type from a URL to help the browser decode properly.
 */
export function detectVideoMime(url: string): string {
  if (!url) return "video/mp4";
  const lower = url.toLowerCase();
  if (lower.includes(".webm")) return "video/webm";
  if (lower.includes(".mkv")) return "video/x-matroska";
  if (lower.includes(".avi")) return "video/x-msvideo";
  if (lower.includes(".mov")) return "video/quicktime";
  if (lower.includes(".m3u8")) return "application/x-mpegURL";
  if (lower.includes(".ts")) return "video/mp2t";
  return "video/mp4";
}
