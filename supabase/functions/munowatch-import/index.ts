// Munowatch importer — logs in with admin's personal Munowatch account,
// walks grid pages, downloads posters to our 'posters' bucket, and queues
// metadata into pending_imports for admin review. NO video URLs are imported.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MW_EMAIL = Deno.env.get("MUNOWATCH_EMAIL")!;
const MW_PASSWORD = Deno.env.get("MUNOWATCH_PASSWORD")!;
const BASE = "https://munowatch.com";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// --- Cookie jar ---
type Jar = Map<string, string>;
function mergeCookies(jar: Jar, setCookieHeader: string | null) {
  if (!setCookieHeader) return;
  // Headers.get joins multiple Set-Cookie with ", " — naive split that handles common cases
  const parts = setCookieHeader.split(/,(?=\s*[A-Za-z0-9_\-]+=)/);
  for (const raw of parts) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      const k = pair.slice(0, eq).trim();
      const v = pair.slice(eq + 1).trim();
      if (k) jar.set(k, v);
    }
  }
}
function cookieHeader(jar: Jar): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchWithJar(jar: Jar, url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36");
  headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  headers.set("Accept-Language", "en-US,en;q=0.9");
  if (jar.size) headers.set("Cookie", cookieHeader(jar));
  const r = await fetch(url, { ...init, headers, redirect: "manual" });
  // capture Set-Cookie
  mergeCookies(jar, r.headers.get("set-cookie"));
  // follow redirects manually so cookies persist
  if (r.status >= 300 && r.status < 400 && r.headers.get("location")) {
    const next = new URL(r.headers.get("location")!, url).toString();
    return await fetchWithJar(jar, next, { method: "GET" });
  }
  return r;
}

async function login(jar: Jar) {
  // GET login page to seed any CSRF / session cookie
  await fetchWithJar(jar, `${BASE}/login`);
  const body = new URLSearchParams({ email: MW_EMAIL, password: MW_PASSWORD });
  const r = await fetchWithJar(jar, `${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Referer": `${BASE}/login` },
    body: body.toString(),
  });
  // After login, hit homepage; if it doesn't redirect to login, we're in
  const probe = await fetchWithJar(jar, `${BASE}/`);
  const html = await probe.text();
  const loggedIn = !/Sign In|name="password"/i.test(html.slice(0, 5000));
  if (!loggedIn) throw new Error("Munowatch login failed — check MUNOWATCH_EMAIL / MUNOWATCH_PASSWORD");
  return r;
}

// --- HTML parsing ---
// Extract movie cards from a grid page. We don't know the exact HTML yet, so
// we look for the most reliable signals: anchor tags pointing to /watch?... or
// /movie/... with an <img> inside, plus surrounding title/vj text.
interface MovieCard {
  source_url: string;
  source_id: string;
  title: string;
  poster: string;
  vj: string;
}

function abs(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  return BASE + (url.startsWith("/") ? url : "/" + url);
}

function parseGrid(html: string): MovieCard[] {
  const cards: MovieCard[] = [];
  // Match <a href="/watch?..."> ... </a> blocks (greedy-stop on next <a or end)
  const aRe = /<a\b[^>]*href=["']([^"']*(?:\/watch\?|\/movie\/|\/show\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = aRe.exec(html)) !== null) {
    const href = m[1];
    const inner = m[2];
    const idMatch = href.match(/[?&]id=(\d+)/) || href.match(/\/(?:movie|show)\/(\d+)/) || href.match(/[?&]p=(\d+)/);
    const sid = idMatch ? idMatch[1] : href;
    if (seen.has(sid)) continue;
    seen.add(sid);
    const imgMatch = inner.match(/<img\b[^>]*?(?:data-src|src)=["']([^"']+)["']/i);
    const altMatch = inner.match(/<img\b[^>]*?alt=["']([^"']+)["']/i);
    // Title may be in alt, in a sibling div, or inside a <p>
    const textMatch = inner.match(/>\s*([^<>{][^<>]{2,80})\s*</);
    const titleRaw = (altMatch?.[1] || textMatch?.[1] || "").trim();
    if (!imgMatch || !titleRaw) continue;
    // Extract VJ from title if "VJ Xxx" appears
    let title = titleRaw, vj = "";
    const vjM = titleRaw.match(/\bvj\s+([a-z][a-z0-9'-]*)/i);
    if (vjM) {
      vj = vjM[1];
      title = titleRaw.slice(0, vjM.index).replace(/[-–—|:]+\s*$/, "").trim();
    }
    cards.push({
      source_url: abs(href),
      source_id: sid,
      title,
      poster: abs(imgMatch[1]),
      vj,
    });
  }
  return cards;
}

// Pull a richer description by visiting the detail page (best-effort)
async function fetchDescription(jar: Jar, detailUrl: string): Promise<{ description: string; year: number; genre: string }> {
  try {
    const r = await fetchWithJar(jar, detailUrl);
    const html = await r.text();
    // Try OG description first
    const og = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    const meta = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = (og?.[1] || meta?.[1] || "").trim();
    const yearM = html.match(/\b(19|20)\d{2}\b/);
    const year = yearM ? parseInt(yearM[0]) : 2024;
    const genreM = html.match(/genre[^<]{0,30}<[^>]*>([A-Za-z][A-Za-z &/]{2,30})</i);
    const genre = genreM ? genreM[1].trim() : "";
    return { description, year, genre };
  } catch {
    return { description: "", year: 2024, genre: "" };
  }
}

// Download poster -> upload to our 'posters' bucket -> return public URL
async function mirrorPoster(jar: Jar, supabase: any, posterUrl: string, sourceId: string): Promise<string> {
  if (!posterUrl) return "";
  try {
    const r = await fetchWithJar(jar, posterUrl);
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "image/jpeg";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const path = `munowatch/${sourceId}.${ext}`;
    const buf = new Uint8Array(await r.arrayBuffer());
    const { error } = await supabase.storage.from("posters").upload(path, buf, {
      contentType: ct, upsert: true,
    });
    if (error) { console.error("poster upload", error.message); return ""; }
    const { data } = supabase.storage.from("posters").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("mirror poster err", (e as Error).message);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!MW_EMAIL || !MW_PASSWORD) throw new Error("MUNOWATCH_EMAIL / MUNOWATCH_PASSWORD not configured");

    const url = new URL(req.url);
    const pipeType = url.searchParams.get("pipe_type") || "p";
    const pipeId = url.searchParams.get("pipe_id") || "4"; // 4 = Latest Movies
    const maxPages = Math.min(parseInt(url.searchParams.get("max_pages") || "1"), 20);
    const fetchDetails = url.searchParams.get("details") !== "0";

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const jar: Jar = new Map();
    await login(jar);

    const result = { pages: 0, found: 0, queued: 0, skipped: 0, errors: [] as string[] };

    for (let page = 1; page <= maxPages; page++) {
      const gridUrl = `${BASE}/grid?pipe_type=${pipeType}&pipe_id=${pipeId}&page=${page}`;
      const r = await fetchWithJar(jar, gridUrl);
      const html = await r.text();
      // Stop if we got bounced to login (session died)
      if (/<title>[^<]*LOGIN[^<]*<\/title>/i.test(html)) {
        result.errors.push(`page ${page}: bounced to login`);
        break;
      }
      const cards = parseGrid(html);
      result.pages++;
      result.found += cards.length;
      if (!cards.length) break; // end of catalog

      for (const c of cards) {
        // dedupe
        const { data: existing } = await supabase
          .from("pending_imports").select("id")
          .eq("source", "munowatch").eq("source_id", c.source_id).maybeSingle();
        if (existing) { result.skipped++; continue; }

        let extra = { description: "", year: 2024, genre: "" };
        if (fetchDetails) {
          extra = await fetchDescription(jar, c.source_url);
          await sleep(1500); // be polite
        }
        const mirroredPoster = await mirrorPoster(jar, supabase, c.poster, c.source_id);

        const { error: insErr } = await supabase.from("pending_imports").insert({
          source: "munowatch",
          source_id: c.source_id,
          source_url: c.source_url,
          dropbox_file_id: `mw_${c.source_id}`, // satisfy NOT NULL
          dropbox_path: c.source_url,
          original_filename: `${c.title}${c.vj ? ` VJ ${c.vj}` : ""}.mp4`,
          parsed_title: c.title,
          parsed_vj: c.vj,
          video_url: "", // intentionally empty — admin uploads file later
          thumbnail_url: mirroredPoster || c.poster,
          description: extra.description,
          year: extra.year,
          duration: "",
          genre: extra.genre,
          category: extra.genre ? [extra.genre] : [],
          rating: "PG-13",
          tmdb_id: null,
          tmdb_matched: false,
          status: "pending",
        });
        if (insErr) { result.errors.push(`${c.title}: ${insErr.message}`); continue; }
        result.queued++;
        await sleep(1500); // rate limit between movies
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("munowatch-import error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
