/**
 * Detect whether a video URL is from a cloud storage provider
 * and generate the appropriate embed/playable URL.
 */

export type CloudProvider = "dropbox" | "google_drive" | "terabox" | "onedrive" | "mediafire" | "mega" | "telegram" | "vimeo" | "pcloud" | "youtube" | null;

export interface CloudVideoInfo {
  provider: CloudProvider;
  embedUrl: string;
  downloadUrl: string;
  originalUrl: string;
  useIframe: boolean;
}

/**
 * Detect which cloud provider a URL belongs to.
 */
export function detectCloudProvider(url: string): CloudProvider {
  if (!url) return null;
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h.includes("dropbox.com") || h.includes("dropboxusercontent.com")) return "dropbox";
    if (h.includes("drive.google.com") || h.includes("docs.google.com")) return "google_drive";
    if (h.includes("terabox.com") || h.includes("terabox.app") || h.includes("teraboxapp.com") || h.includes("1024tera.com") || h.includes("1024terabox.com")) return "terabox";
    if (h.includes("1drv.ms") || h.includes("onedrive.live.com") || h.includes("sharepoint.com")) return "onedrive";
    if (h.includes("mediafire.com")) return "mediafire";
    if (h.includes("mega.nz") || h.includes("mega.co.nz")) return "mega";
    if (h === "t.me" || h === "telegram.me") return "telegram";
    if (h === "vimeo.com" || h === "www.vimeo.com" || h.endsWith(".vimeo.com") || h === "player.vimeo.com") return "vimeo";
    if (h.includes("pcloud.link") || h.includes("pcloud.com")) return "pcloud";
    if (h === "youtube.com" || h === "www.youtube.com" || h === "youtu.be" || h === "m.youtube.com") return "youtube";
  } catch {}
  return null;
}

/**
 * Check if a URL is a cloud storage URL.
 */
export function isCloudStorageUrl(url: string): boolean {
  return detectCloudProvider(url) !== null;
}

/**
 * Generate embed and download URLs for cloud storage videos.
 */
export function getCloudVideoInfo(url: string): CloudVideoInfo {
  const provider = detectCloudProvider(url);

  if (!provider) {
    return { provider: null, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: false };
  }

  try {
    const u = new URL(url);

    switch (provider) {
      case "dropbox": {
        // If it's already a direct content URL, return as-is
        if (u.hostname.includes("dropboxusercontent.com")) {
          return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: false };
        }
        // Dropbox: use dl.dropboxusercontent.com for /s/ links, or dl=1 for /scl/ links
        if (u.pathname.startsWith("/s/") || u.pathname.startsWith("/sh/")) {
          const directUrl = new URL(url);
          directUrl.hostname = "dl.dropboxusercontent.com";
          directUrl.searchParams.delete("dl");
          return {
            provider,
            embedUrl: directUrl.toString(),
            downloadUrl: directUrl.toString(),
            originalUrl: url,
            useIframe: false,
          };
        }
        // /scl/ links
        const dlUrl = new URL(url);
        dlUrl.searchParams.set("dl", "1");
        return {
          provider,
          embedUrl: dlUrl.toString(),
          downloadUrl: dlUrl.toString(),
          originalUrl: url,
          useIframe: false,
        };
      }

      case "google_drive": {
        const match = u.pathname.match(/\/file\/d\/([^/]+)/);
        if (match) {
          const fileId = match[1];
          return {
            provider,
            embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
            originalUrl: url,
            useIframe: true,
          };
        }
        return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: true };
      }

      case "terabox": {
        // Direct download links (d.terabox.com, d2.terabox.com) can play natively
        if (u.hostname.match(/^d\d*\./) && u.hostname.includes("terabox")) {
          return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: false };
        }
        // All sharing links (/s/...) must use iframe — they are web pages
        return {
          provider,
          embedUrl: url,
          downloadUrl: url,
          originalUrl: url,
          useIframe: true,
        };
      }

      case "onedrive": {
        const dlUrl = new URL(url);
        dlUrl.searchParams.set("download", "1");
        return {
          provider,
          embedUrl: url,
          downloadUrl: dlUrl.toString(),
          originalUrl: url,
          useIframe: false,
        };
      }

      case "mediafire": {
        return {
          provider,
          embedUrl: url,
          downloadUrl: url,
          originalUrl: url,
          useIframe: true,
        };
      }

      case "mega": {
        const embedUrl = url.replace("mega.nz/file/", "mega.nz/embed/").replace("mega.co.nz/file/", "mega.co.nz/embed/");
        return {
          provider,
          embedUrl,
          downloadUrl: url,
          originalUrl: url,
          useIframe: true,
        };
      }

      case "telegram": {
        // Convert t.me/channel/123 to embeddable URL
        const embedUrl = url.includes("?embed=") ? url : `${url.replace(/\/$/, "")}?embed=1`;
        return {
          provider,
          embedUrl,
          downloadUrl: url,
          originalUrl: url,
          useIframe: true,
        };
      }

      case "pcloud": {
        // pCloud public share link → append download=1 for direct CDN URL.
        // The link 302s to api.pcloud.com → the CDN file URL, which streams natively.
        if (u.pathname.includes("/publink/")) {
          const dlUrl = new URL(url);
          dlUrl.searchParams.set("download", "1");
          return {
            provider,
            embedUrl: dlUrl.toString(),
            downloadUrl: dlUrl.toString(),
            originalUrl: url,
            useIframe: false,
          };
        }
        // Already a direct CDN URL (e.g. p-luna.pcloud.com)
        return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: false };
      }

      case "youtube": {
        // YouTube watch URL → embeddable player. Used for trailers only.
        const host = u.hostname.toLowerCase();
        let videoId = "";
        if (host === "youtu.be") {
          videoId = u.pathname.replace(/^\//, "").split("/")[0];
        } else {
          videoId = u.searchParams.get("v") || u.pathname.match(/\/(embed|shorts)\/([^/?]+)/)?.[2] || "";
        }
        if (videoId) {
          const params = new URLSearchParams({
            autoplay: "1",
            mute: "1",
            controls: "0",
            rel: "0",
            modestbranding: "1",
            playsinline: "1",
            loop: "1",
            playlist: videoId,
            iv_load_policy: "3",
            fs: "0",
          });
          return {
            provider,
            embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`,
            downloadUrl: url,
            originalUrl: url,
            useIframe: true,
          };
        }
        return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: true };
      }

      case "vimeo": {
        // Extract numeric video ID from URL paths like:
        //   https://vimeo.com/1183125392
        //   https://vimeo.com/1183125392/abc123  (private hash)
        //   https://player.vimeo.com/video/1183125392
        const segments = u.pathname.split("/").filter(Boolean);
        const videoIdx = segments.findIndex((s) => /^\d+$/.test(s));
        const videoId = videoIdx >= 0 ? segments[videoIdx] : "";
        const hash = videoIdx >= 0 && segments[videoIdx + 1] && !/^\d+$/.test(segments[videoIdx + 1])
          ? segments[videoIdx + 1]
          : "";
        if (videoId) {
          // Use Vimeo's native player with controls enabled but branding hidden.
          // title=0, byline=0, portrait=0 hide the uploader info ("V" avatar, name, watch later, share).
          // sidedock=0 removes the right-side dock (Watch Later, Share, Vimeo logo button).
          // Note: Vimeo Free plans always show the "Vimeo" wordmark — Plus/Pro removes it.
          const params = new URLSearchParams({
            autoplay: "1",
            autopause: "0",
            title: "0",
            byline: "0",
            portrait: "0",
            badge: "0",
            sidedock: "0",
            dnt: "1",
            playsinline: "1",
            pip: "0",
            color: "8b5cf6",
          });
          if (hash) params.set("h", hash);
          const embedUrl = `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
          return {
            provider,
            embedUrl,
            downloadUrl: url,
            originalUrl: url,
            useIframe: true,
          };
        }
        return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: true };
      }
    }
  } catch {}

  return { provider, embedUrl: url, downloadUrl: url, originalUrl: url, useIframe: false };
}

/**
 * Get a human-readable label for the cloud provider (internal use only).
 */
export function getProviderLabel(provider: CloudProvider): string {
  switch (provider) {
    case "dropbox": return "Cloud";
    case "google_drive": return "Cloud";
    case "terabox": return "Cloud";
    case "onedrive": return "Cloud";
    case "mediafire": return "Cloud";
    case "mega": return "Cloud";
    case "telegram": return "Cloud";
    case "pcloud": return "Cloud";
    case "vimeo": return "Vimeo";
    case "youtube": return "YouTube";
    default: return "Direct";
  }
}
