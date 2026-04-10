const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
  if (!TELEGRAM_API_KEY) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { chatId, messageId } = await req.json();

    if (!chatId || !messageId) {
      return new Response(JSON.stringify({ error: 'chatId and messageId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': TELEGRAM_API_KEY,
      'Content-Type': 'application/json',
    };

    // Forward the message back to the same channel to get the file_id
    // (bots can't forward to themselves, but can forward within a channel they admin)
    const fwdResponse = await fetch(`${GATEWAY_URL}/forwardMessage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chat_id: chatId,
        from_chat_id: chatId,
        message_id: parseInt(messageId, 10),
      }),
    });
    const fwdData = await fwdResponse.json();
    
    if (!fwdResponse.ok) {
      // If forwarding fails, try copyMessage as fallback
      const copyResponse = await fetch(`${GATEWAY_URL}/copyMessage`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chat_id: chatId,
          from_chat_id: chatId,
          message_id: parseInt(messageId, 10),
        }),
      });
      const copyData = await copyResponse.json();
      
      if (!copyResponse.ok) {
        throw new Error(`Cannot access message: ${JSON.stringify(fwdData)} / ${JSON.stringify(copyData)}`);
      }
      
      // copyMessage doesn't return file details, so we can't proceed this way.
      // Let's try getChat + channel history via getUpdates approach
      throw new Error(`Could not extract file_id. Forward: ${JSON.stringify(fwdData)}`);
    }

    const message = fwdData.result;
    
    // Extract video file_id from the forwarded message
    let fileId: string | null = null;
    if (message.video) {
      fileId = message.video.file_id;
    } else if (message.document) {
      fileId = message.document.file_id;
    } else if (message.animation) {
      fileId = message.animation.file_id;
    }

    if (!fileId) {
      return new Response(JSON.stringify({ error: 'No video found in this message' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Get file path from Telegram
    const fileResponse = await fetch(`${GATEWAY_URL}/getFile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ file_id: fileId }),
    });
    const fileData = await fileResponse.json();
    if (!fileResponse.ok) {
      throw new Error(`getFile failed [${fileResponse.status}]: ${JSON.stringify(fileData)}`);
    }

    const filePath = fileData.result.file_path;
    const fileSize = fileData.result.file_size || 0;

    // For files > 20MB, Telegram Bot API doesn't support direct download
    // In that case, return info so the client can handle accordingly
    if (fileSize > 20 * 1024 * 1024) {
      return new Response(JSON.stringify({ 
        error: 'file_too_large',
        message: 'Video exceeds 20MB Telegram Bot API limit. Consider using Telegram Premium or splitting the video.',
        fileSize,
      }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 3: Download the file via gateway
    const downloadResponse = await fetch(`${GATEWAY_URL}/file/${filePath}`, {
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': TELEGRAM_API_KEY,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`File download failed [${downloadResponse.status}]`);
    }

    // Stream the video bytes back to the client
    const contentType = message.video ? 'video/mp4' : 
                        message.document?.mime_type || 'application/octet-stream';

    return new Response(downloadResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: unknown) {
    console.error('Telegram video proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
