// Returns a fresh ~4h Dropbox streaming URL for a stored path.
// Called by the player right before playback so links never expire mid-watch.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DBX_APP_KEY = Deno.env.get("DROPBOX_APP_KEY")!;
const DBX_APP_SECRET = Deno.env.get("DROPBOX_APP_SECRET")!;
const DBX_REFRESH = Deno.env.get("DROPBOX_APP_REFRESH_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

let _cachedToken: { token: string; expiresAt: number } | null = null;
async function getDropboxToken(): Promise<string> {
  if (_cachedToken && _cachedToken.expiresAt > Date.now() + 60_000) return _cachedToken.token;
  const basic = btoa(`${DBX_APP_KEY}:${DBX_APP_SECRET}`);
  const r = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: DBX_REFRESH }),
  });
  if (!r.ok) throw new Error(`Dropbox token refresh ${r.status}: ${await r.text()}`);
  const j = await r.json();
  _cachedToken = { token: j.access_token, expiresAt: Date.now() + (j.expires_in ?? 14400) * 1000 };
  return _cachedToken.token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!DROPBOX_TOKEN) throw new Error("DROPBOX_ACCESS_TOKEN not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { path } = await req.json();
    if (!path || typeof path !== "string") throw new Error("path required");

    const r = await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
      method: "POST",
      headers: { Authorization: `Bearer ${await getDropboxToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (!r.ok) throw new Error(`Dropbox ${r.status}: ${await r.text()}`);
    const j = await r.json();

    return new Response(JSON.stringify({ url: j.link, expires_in: 4 * 60 * 60 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
