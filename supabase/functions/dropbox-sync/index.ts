// Polls Dropbox folders, parses filenames, enriches via TMDB, queues for admin review.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DBX_APP_KEY = Deno.env.get("DROPBOX_APP_KEY")!;
const DBX_APP_SECRET = Deno.env.get("DROPBOX_APP_SECRET")!;
const DBX_REFRESH = Deno.env.get("DROPBOX_APP_REFRESH_TOKEN")!;
const TMDB_TOKEN = Deno.env.get("TMDB_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VIDEO_EXTS = [".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v"];

let _cachedToken: { token: string; expiresAt: number } | null = null;
async function getDropboxToken(): Promise<string> {
  if (_cachedToken && _cachedToken.expiresAt > Date.now() + 60_000) return _cachedToken.token;
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: DBX_REFRESH });
  const basic = btoa(`${DBX_APP_KEY}:${DBX_APP_SECRET}`);
  const r = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`Dropbox token refresh ${r.status}: ${await r.text()}`);
  const j = await r.json();
  _cachedToken = { token: j.access_token, expiresAt: Date.now() + (j.expires_in ?? 14400) * 1000 };
  return _cachedToken.token;
}

// --- Filename parsing ---
// "Avengers Endgame VJ Junior.mp4" -> title="Avengers Endgame", vj="Junior"
// Also strips junk: quality tags, year tags, brackets, etc.
function parseFilename(filename: string): { title: string; vj: string } {
  let name = filename.replace(/\.[^.]+$/, ""); // strip extension
  name = name.replace(/[._]+/g, " ");           // dots/underscores -> spaces
  name = name.replace(/\[[^\]]*\]|\([^)]*\)/g, " "); // strip [..] (..)
  // strip common junk tags
  name = name.replace(/\b(720p|1080p|2160p|4k|hdrip|webrip|bluray|x264|x265|hevc|aac|dvdrip|hdcam|cam)\b/gi, " ");
  name = name.replace(/\s+/g, " ").trim();

  let vj = "";
  let title = name;
  // Match "VJ <name>" - capture word(s) after VJ
  const vjMatch = name.match(/\bvj\s+([a-z][a-z0-9'-]*)/i);
  if (vjMatch) {
    vj = vjMatch[1];
    title = name.substring(0, vjMatch.index).trim();
  }
  // Cleanup trailing punctuation/dashes
  title = title.replace(/[-–—|:]+\s*$/, "").trim();
  return { title: title || name, vj };
}

// --- Dropbox API ---
async function dbx(endpoint: string, body: unknown) {
  const r = await fetch(`https://api.dropboxapi.com/2${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DROPBOX_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Dropbox ${endpoint} failed ${r.status}: ${await r.text()}`);
  return r.json();
}

async function listFolder(path: string, cursor: string | null) {
  if (cursor) return await dbx("/files/list_folder/continue", { cursor });
  return await dbx("/files/list_folder", { path, recursive: false, include_media_info: false });
}

async function getTempLink(path: string): Promise<string> {
  const r = await dbx("/files/get_temporary_link", { path });
  return r.link;
}

async function getSharedLink(path: string): Promise<string> {
  // Try to create one; if exists, list existing
  try {
    const r = await dbx("/sharing/create_shared_link_with_settings", {
      path,
      settings: { requested_visibility: "public", audience: "public", access: "viewer" },
    });
    return r.url;
  } catch {
    const r = await dbx("/sharing/list_shared_links", { path, direct_only: true });
    if (r.links?.[0]?.url) return r.links[0].url;
    return "";
  }
}

// Convert dropbox.com share link -> direct streaming URL
function toDirectDropboxUrl(shareUrl: string): string {
  if (!shareUrl) return "";
  return shareUrl
    .replace("www.dropbox.com", "dl.dropboxusercontent.com")
    .replace(/[?&]dl=0/, "")
    .replace(/[?&]dl=1/, "");
}

// --- TMDB enrichment ---
async function tmdbSearch(title: string) {
  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" } });
  if (!r.ok) return null;
  const j = await r.json();
  return j.results?.[0] || null;
}

async function tmdbDetails(id: number) {
  const r = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=en-US`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" },
  });
  if (!r.ok) return null;
  return await r.json();
}

const GENRE_TO_CATEGORY: Record<string, string[]> = {
  Action: ["Action"], Adventure: ["Action"], Animation: ["Animation"],
  Comedy: ["Comedy"], Crime: ["Thriller"], Documentary: ["Documentary"],
  Drama: ["Drama"], Family: ["Family"], Fantasy: ["Fantasy"],
  History: ["Drama"], Horror: ["Horror"], Music: ["Drama"],
  Mystery: ["Thriller"], Romance: ["Romance"], "Science Fiction": ["Sci-Fi"],
  Thriller: ["Thriller"], War: ["Action"], Western: ["Action"],
};

function fmtRuntime(min: number): string {
  if (!min) return "";
  const h = Math.floor(min / 60), m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// --- Lovable AI fallback (for local Ugandan films TMDB doesn't know) ---
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const VALID_CATEGORIES = ["Action", "Comedy", "Drama", "Thriller", "Horror", "Romance", "Sci-Fi", "Fantasy", "Animation", "Documentary", "Family"];

async function aiFallback(title: string, vj: string) {
  if (!LOVABLE_API_KEY) return null;
  const vjNote = vj ? ` narrated by VJ ${vj}` : "";
  const prompt = `You are a movie metadata expert familiar with Ugandan/East African cinema and VJ-narrated films. For the movie titled "${title}"${vjNote}, generate plausible metadata. If you don't recognize it, infer reasonable details from the title alone. Return ONLY valid JSON (no markdown, no code fences) with these exact keys:
{"description": "2-3 sentence plot synopsis", "genre": "primary genre name", "categories": ["one or more from: Action, Comedy, Drama, Thriller, Horror, Romance, Sci-Fi, Fantasy, Animation, Documentary, Family"], "year": 2020, "duration": "1h 45m", "rating": "PG-13"}`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) {
      console.error("AI fallback failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    let text = j.choices?.[0]?.message?.content || "";
    // Strip markdown code fences if present
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const meta = JSON.parse(text);
    const cats = (meta.categories || []).filter((c: string) => VALID_CATEGORIES.includes(c));
    return {
      tmdb_id: null,
      description: meta.description || "",
      year: parseInt(meta.year) || 2025,
      duration: meta.duration || "1h 30m",
      thumbnail_url: "", // No poster - admin will need to add manually
      genre: meta.genre || "Drama",
      category: cats.length ? cats : ["Drama"],
      rating: meta.rating || "PG-13",
    };
  } catch (e) {
    console.error("AI fallback parse error:", (e as Error).message);
    return null;
  }
}

async function enrich(title: string, vj: string) {
  const hit = await tmdbSearch(title);
  if (!hit) {
    console.log(`TMDB miss for "${title}" - using AI fallback`);
    return await aiFallback(title, vj);
  }
  const details = await tmdbDetails(hit.id);
  if (!details) return await aiFallback(title, vj);
  const cats = new Set<string>();
  for (const g of details.genres || []) {
    (GENRE_TO_CATEGORY[g.name] || []).forEach((c) => cats.add(c));
  }
  return {
    tmdb_id: hit.id,
    description: details.overview || "",
    year: details.release_date ? parseInt(details.release_date.slice(0, 4)) : 2025,
    duration: fmtRuntime(details.runtime || 0),
    thumbnail_url: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : "",
    genre: details.genres?.[0]?.name || "",
    category: Array.from(cats),
    rating: details.adult ? "R" : "PG-13",
  };
}

// --- Main sync ---
async function syncFolder(supabase: any, folder: any) {
  const result = { folder: folder.folder_path, found: 0, new: 0, errors: [] as string[] };
  let cursor: string | null = folder.last_cursor;
  let hasMore = true;
  const allEntries: any[] = [];

  while (hasMore) {
    const page: any = await listFolder(folder.folder_path, cursor);
    allEntries.push(...page.entries);
    cursor = page.cursor;
    hasMore = page.has_more;
  }

  for (const entry of allEntries) {
    if (entry[".tag"] !== "file") continue;
    const ext = entry.name.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext || !VIDEO_EXTS.includes(ext)) continue;
    result.found++;

    // Dedupe by dropbox file id
    const { data: existing } = await supabase
      .from("pending_imports").select("id").eq("dropbox_file_id", entry.id).maybeSingle();
    if (existing) continue;
    // Also skip if already published
    const { data: pubExisting } = await supabase
      .from("titles").select("id").eq("video_url", entry.path_lower).maybeSingle();
    if (pubExisting) continue;

    try {
      const { title, vj } = parseFilename(entry.name);
      let videoUrl = "";
      try {
        const share = await getSharedLink(entry.path_lower);
        videoUrl = toDirectDropboxUrl(share);
      } catch (e) {
        // Fallback to temporary link (4hr expiry, but works for now)
        videoUrl = await getTempLink(entry.path_lower);
      }
      const meta = await enrich(title, vj);

      await supabase.from("pending_imports").insert({
        dropbox_file_id: entry.id,
        dropbox_path: entry.path_lower,
        original_filename: entry.name,
        parsed_title: title,
        parsed_vj: vj,
        video_url: videoUrl,
        thumbnail_url: meta?.thumbnail_url || "",
        description: meta?.description || "",
        year: meta?.year || 2025,
        duration: meta?.duration || "",
        genre: meta?.genre || "",
        category: meta?.category || [],
        rating: meta?.rating || "PG",
        tmdb_id: meta?.tmdb_id || null,
        tmdb_matched: !!meta,
        status: "pending",
      });
      result.new++;
    } catch (e) {
      result.errors.push(`${entry.name}: ${(e as Error).message}`);
    }
  }

  await supabase.from("dropbox_folders").update({
    last_synced_at: new Date().toISOString(),
    last_cursor: cursor,
  }).eq("id", folder.id);

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!DROPBOX_TOKEN) throw new Error("DROPBOX_ACCESS_TOKEN not configured");
    if (!TMDB_TOKEN) throw new Error("TMDB_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: folders, error } = await supabase
      .from("dropbox_folders").select("*").eq("enabled", true);
    if (error) throw error;

    const results = [];
    for (const f of folders || []) {
      try { results.push(await syncFolder(supabase, f)); }
      catch (e) { results.push({ folder: f.folder_path, error: (e as Error).message }); }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dropbox-sync error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
