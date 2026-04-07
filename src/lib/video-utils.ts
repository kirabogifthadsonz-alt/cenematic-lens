// Detect video source type from URL and transform for playback.
// We hide the actual source from users by proxying through our player.

export type VideoSource = "direct" | "terabox" | "dropbox" | "gdrive" | "unknown";

export function detectSource(url: string): VideoSource {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (lower.includes("terabox") || lower.includes("1024tera") || lower.includes("freeterabox") || lower.includes("teraboxapp")) return "terabox";
  if (lower.includes("dropbox.com") || lower.includes("dl.dropboxusercontent")) return "dropbox";
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) return "gdrive";
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".m3u8") || lower.includes("commondatastorage")) return "direct";
  return "direct"; // default to direct playback attempt
}

/**
 * Transform URL for direct playback.
 * - Dropbox: change dl=0 to dl=1 for direct download
 * - Google Drive: convert share link to direct embed
 * - TeraBox: use as-is (direct links from admin)
 */
export function getPlayableUrl(url: string): string {
  const source = detectSource(url);

  switch (source) {
    case "dropbox": {
      // Convert sharing URL to direct download
      let playable = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
      playable = playable.replace("dl=0", "dl=1");
      if (!playable.includes("dl=1") && !playable.includes("dl.dropboxusercontent")) {
        playable += (playable.includes("?") ? "&" : "?") + "dl=1";
      }
      return playable;
    }
    case "gdrive": {
      // Extract file ID and create direct download link
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
      // Try export pattern
      const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        return `https://drive.google.com/uc?export=download&id=${idMatch[1]}`;
      }
      return url;
    }
    case "terabox":
      // TeraBox direct links work as-is
      return url;
    default:
      return url;
  }
}

/**
 * For Google Drive, we can use an iframe embed as fallback
 */
export function getGDriveEmbedUrl(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }
  return null;
}
