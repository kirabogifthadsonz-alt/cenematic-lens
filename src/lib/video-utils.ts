// Detect video source type from URL and transform for playback.
// We hide the actual source from users by proxying through our player.

export type VideoSource = "direct" | "terabox" | "dropbox" | "gdrive" | "unknown";

export function detectSource(url: string): VideoSource {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (lower.includes("terabox") || lower.includes("1024tera") || lower.includes("freeterabox") || lower.includes("teraboxapp") || lower.includes("nephobox") || lower.includes("mirrorbox") || lower.includes("mirrobox") || lower.includes("4funbox")) return "terabox";
  if (lower.includes("dropbox.com") || lower.includes("dl.dropboxusercontent")) return "dropbox";
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) return "gdrive";
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".m3u8") || lower.includes("commondatastorage")) return "direct";
  return "direct";
}

/**
 * Transform URL for direct playback (non-iframe sources).
 */
export function getPlayableUrl(url: string): string {
  const source = detectSource(url);

  switch (source) {
    case "dropbox": {
      let playable = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
      playable = playable.replace("dl=0", "dl=1");
      if (!playable.includes("dl=1") && !playable.includes("dl.dropboxusercontent")) {
        playable += (playable.includes("?") ? "&" : "?") + "dl=1";
      }
      return playable;
    }
    case "gdrive": {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      return url;
    }
    default:
      return url;
  }
}

/**
 * For Google Drive, iframe embed fallback
 */
export function getGDriveEmbedUrl(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  return null;
}

/**
 * For TeraBox links, return the sharing URL directly for iframe embedding.
 * TeraBox handles its own streaming/buffering via their native player.
 */
export function getTeraboxEmbedUrl(url: string): string {
  // Normalize all TeraBox domain variants to 1024terabox.com for consistency
  return url;
}

/**
 * Check if source needs iframe-based playback
 */
export function needsIframePlayer(source: VideoSource): boolean {
  return source === "terabox" || source === "gdrive";
}
