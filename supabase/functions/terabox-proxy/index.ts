const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Fetch the TeraBox sharing page HTML
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      },
      redirect: "follow",
    });

    if (!pageRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch TeraBox page", status: pageRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageRes.text();

    // Step 2: Extract video URL from page data
    // TeraBox pages embed video data in JS variables or JSON blocks
    let videoUrl: string | null = null;

    // Pattern 1: Look for direct stream URLs in page source
    const streamPatterns = [
      // dlink or streaming URL in JSON
      /"dlink"\s*:\s*"(https?:[^"]+\.m3u8[^"]*)"/,
      /"dlink"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/,
      /"dlink"\s*:\s*"(https?:[^"]+)"/,
      // Streaming URL patterns
      /streaming_url['"]\s*:\s*['"](https?:[^'"]+)['"]/,
      /stream_url['"]\s*:\s*['"](https?:[^'"]+)['"]/,
      /video_url['"]\s*:\s*['"](https?:[^'"]+)['"]/,
      /videoUrl['"]\s*:\s*['"](https?:[^'"]+)['"]/,
      // Direct MP4/M3U8 URLs in the page
      /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]*)/,
      /(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/,
      // data-video or data-url attributes
      /data-video\s*=\s*["'](https?:[^"']+)["']/,
      /data-url\s*=\s*["'](https?:[^"']+)["']/,
    ];

    for (const pattern of streamPatterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        // Decode unicode escapes and HTML entities
        let candidate = match[1]
          .replace(/\\u002F/g, "/")
          .replace(/\\u003A/g, ":")
          .replace(/\\u0026/g, "&")
          .replace(/\\\//g, "/")
          .replace(/&amp;/g, "&");
        
        // Validate it looks like a media URL
        if (
          candidate.includes(".mp4") ||
          candidate.includes(".m3u8") ||
          candidate.includes("stream") ||
          candidate.includes("video") ||
          candidate.includes("media")
        ) {
          videoUrl = candidate;
          break;
        }
      }
    }

    // Pattern 2: Try to find shareid/uk/sign for API-based extraction
    if (!videoUrl) {
      const shareIdMatch = html.match(/shareid['"]\s*:\s*(\d+)/);
      const ukMatch = html.match(/uk['"]\s*:\s*(\d+)/);
      const signMatch = html.match(/sign['"]\s*:\s*["']([^"']+)["']/);
      const timestampMatch = html.match(/timestamp['"]\s*:\s*(\d+)/);

      if (shareIdMatch && ukMatch && signMatch && timestampMatch) {
        const shareId = shareIdMatch[1];
        const uk = ukMatch[1];
        const sign = signMatch[1];
        const timestamp = timestampMatch[1];

        // Extract the hostname from the original URL
        const urlObj = new URL(url);
        const apiBase = `${urlObj.protocol}//${urlObj.hostname}`;

        // Try the file list API
        const apiUrl = `${apiBase}/share/list?app_id=250528&shorturl=${encodeURIComponent(url.split("/s/")[1] || "")}&shareid=${shareId}&uk=${uk}&sign=${sign}&timestamp=${timestamp}&page=1&num=20&root=1&fid=0&channel=dubox&web=1&clienttype=0`;

        try {
          const apiRes = await fetch(apiUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
              Cookie: pageRes.headers.get("set-cookie") || "",
              Referer: url,
            },
          });

          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData?.list?.[0]?.dlink) {
              videoUrl = apiData.list[0].dlink;
            }
          }
        } catch {
          // API approach failed, continue
        }
      }
    }

    // Pattern 3: Look for window.__INITIAL_STATE__ or similar data blobs
    if (!videoUrl) {
      const jsonBlobMatch = html.match(
        /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*(?:<\/script>|window\.)/
      );
      if (jsonBlobMatch) {
        try {
          const decoded = jsonBlobMatch[1]
            .replace(/\\u002F/g, "/")
            .replace(/\\u003A/g, ":")
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/");
          
          // Search for URL-like strings in the blob
          const urlMatches = decoded.match(/https?:\/\/[^\s"'\\]+\.mp4[^\s"'\\]*/g);
          if (urlMatches?.[0]) {
            videoUrl = urlMatches[0];
          }
        } catch {
          // JSON parse failed
        }
      }
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({
          error: "Could not extract video URL",
          fallback: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ videoUrl, source: "proxy" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err), fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
