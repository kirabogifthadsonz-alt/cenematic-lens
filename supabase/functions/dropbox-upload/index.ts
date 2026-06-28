// Streams an uploaded file from the admin browser straight into Dropbox via
// upload_session (chunked). Returns the dropbox path + a fresh streaming URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-filename, x-folder",
  "Access-Control-Expose-Headers": "content-type",
};

const DBX_APP_KEY = Deno.env.get("DROPBOX_APP_KEY")!;
const DBX_APP_SECRET = Deno.env.get("DROPBOX_APP_SECRET")!;
const DBX_REFRESH = Deno.env.get("DROPBOX_APP_REFRESH_TOKEN")!;

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
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Dropbox chunk size — 8MB is safe & fast. Max per call is 150MB.
const CHUNK = 8 * 1024 * 1024;

async function dbxContent(endpoint: string, arg: unknown, body: Uint8Array | null) {
  const r = await fetch(`https://content.dropboxapi.com/2${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getDropboxToken()}`,
      "Dropbox-API-Arg": JSON.stringify(arg),
      "Content-Type": "application/octet-stream",
    },
    body: body ?? new Uint8Array(),
  });
  if (!r.ok) throw new Error(`Dropbox ${endpoint} ${r.status}: ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : {};
}

async function dbxRpc(endpoint: string, body: unknown) {
  const r = await fetch(`https://api.dropboxapi.com/2${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await getDropboxToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Dropbox ${endpoint} ${r.status}: ${await r.text()}`);
  return r.json();
}

async function uploadStream(stream: ReadableStream<Uint8Array>, dropboxPath: string) {
  const reader = stream.getReader();
  let buffer = new Uint8Array(0);
  let sessionId = "";
  let offset = 0;
  let done = false;
  let started = false;

  const flush = async (chunk: Uint8Array, isLast: boolean) => {
    if (!started) {
      const res = await dbxContent("/files/upload_session/start", { close: false }, chunk);
      sessionId = res.session_id;
      started = true;
      offset += chunk.length;
      if (isLast) {
        await dbxContent("/files/upload_session/finish", {
          cursor: { session_id: sessionId, offset },
          commit: { path: dropboxPath, mode: "add", autorename: true, mute: true },
        }, new Uint8Array());
      }
      return;
    }
    if (isLast) {
      await dbxContent("/files/upload_session/finish", {
        cursor: { session_id: sessionId, offset },
        commit: { path: dropboxPath, mode: "add", autorename: true, mute: true },
      }, chunk);
      offset += chunk.length;
    } else {
      await dbxContent("/files/upload_session/append_v2", {
        cursor: { session_id: sessionId, offset },
        close: false,
      }, chunk);
      offset += chunk.length;
    }
  };

  while (!done) {
    const { value, done: d } = await reader.read();
    done = d;
    if (value && value.length) {
      const merged = new Uint8Array(buffer.length + value.length);
      merged.set(buffer, 0);
      merged.set(value, buffer.length);
      buffer = merged;
    }
    while (buffer.length >= CHUNK) {
      const chunk = buffer.slice(0, CHUNK);
      buffer = buffer.slice(CHUNK);
      await flush(chunk, false);
    }
  }
  // Final flush — even if buffer is empty we must finish the session
  await flush(buffer, true);
}

async function getTempLink(path: string): Promise<string> {
  const r = await dbxRpc("/files/get_temporary_link", { path });
  return r.link;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!DROPBOX_TOKEN) throw new Error("DROPBOX_ACCESS_TOKEN not configured");

    // Admin-only auth
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
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: claims.claims.sub, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!req.body) throw new Error("No file body");

    const filename = (req.headers.get("x-filename") || `upload-${Date.now()}.mp4`)
      .replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
    const folder = (req.headers.get("x-folder") || "/Movies").replace(/\/+$/, "") || "/Movies";
    const dropboxPath = `${folder}/${Date.now()}-${filename}`;

    await uploadStream(req.body, dropboxPath);
    const tempUrl = await getTempLink(dropboxPath);

    return new Response(JSON.stringify({
      success: true,
      dropbox_path: dropboxPath,
      stream_url: tempUrl,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("dropbox-upload error:", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
