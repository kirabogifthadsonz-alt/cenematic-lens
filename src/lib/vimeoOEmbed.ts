/**
 * Vimeo oEmbed helpers — fetch thumbnail and full metadata for a Vimeo URL
 * using the public oEmbed API (no API key required).
 */

export interface VimeoMetadata {
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  durationSeconds: number | null;
  authorName: string | null;
}

function isVimeoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "vimeo.com" ||
      host === "www.vimeo.com" ||
      host.endsWith(".vimeo.com") ||
      host === "player.vimeo.com"
    );
  } catch {
    return false;
  }
}

function upgradeThumb(thumb: string): string {
  // Upgrade Vimeo sized thumbs (…_295x166.jpg) to a larger 1280-wide variant.
  return thumb.replace(/_\d+x\d+(\.[a-z]+)/i, "_1280$1");
}

/**
 * Fetch the highest-quality thumbnail for a Vimeo URL.
 * Returns null if the URL isn't a Vimeo link or the lookup fails.
 */
export async function fetchVimeoThumbnail(url: string): Promise<string | null> {
  if (!url || !isVimeoUrl(url)) return null;
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const thumb: string | undefined = data?.thumbnail_url_with_play_button || data?.thumbnail_url;
    return thumb ? upgradeThumb(thumb) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch full Vimeo metadata: title, description, duration, thumbnail, author.
 * Returns null if the URL isn't a Vimeo link or the lookup fails.
 */
export async function fetchVimeoMetadata(url: string): Promise<VimeoMetadata | null> {
  if (!url || !isVimeoUrl(url)) return null;
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1280`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const thumb: string | undefined = data?.thumbnail_url_with_play_button || data?.thumbnail_url;
    return {
      title: data?.title ?? null,
      description: data?.description ?? null,
      thumbnail: thumb ? upgradeThumb(thumb) : null,
      durationSeconds: typeof data?.duration === "number" ? data.duration : null,
      authorName: data?.author_name ?? null,
    };
  } catch {
    return null;
  }
}
