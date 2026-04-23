// Detect video source type from URL and transform for playback.
// We hide the actual source from users by proxying through our player.

export type VideoSource = "direct" | "terabox" | "dropbox" | "gdrive" | "telegram" | "unknown";

export function detectSource(url: string): VideoSource {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (lower.includes("t.me/") || lower.includes("telegram.me/")) return "telegram";
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
      // Convert any dropbox.com share link to direct streamable URL
      let playable = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
      // Remove dl=0/dl=1 params - dl.dropboxusercontent serves raw content directly
      playable = playable.replace(/[?&]dl=[01]/g, "");
      // Some links use ?raw=1 - keep them as is, otherwise the host alone streams correctly
      // Clean up potential trailing ? or &
      playable = playable.replace(/[?&]$/, "");
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

/**
 * Parse Telegram channel URL to extract chat ID and message ID.
 * Supports: https://t.me/c/CHANNEL_ID/MESSAGE_ID (private channels)
 *           https://t.me/USERNAME/MESSAGE_ID (public channels)
 */
export function parseTelegramUrl(url: string): { chatId: string; messageId: string } | null {
  // Private channel: t.me/c/CHANNEL_ID/MESSAGE_ID
  const privateMatch = url.match(/t\.me\/c\/(\d+)\/(\d+)/);
  if (privateMatch) {
    // Private channel IDs need -100 prefix for Bot API
    return { chatId: `-100${privateMatch[1]}`, messageId: privateMatch[2] };
  }
  // Public channel: t.me/USERNAME/MESSAGE_ID
  const publicMatch = url.match(/t\.me\/([^\/]+)\/(\d+)/);
  if (publicMatch && publicMatch[1] !== 'c') {
    return { chatId: `@${publicMatch[1]}`, messageId: publicMatch[2] };
  }
  return null;
}
