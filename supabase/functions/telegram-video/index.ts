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

    // Step 1: Forward the message to get a copy with file access
    // Use copyMessage to a temp location, or directly use getFile if we have file_id
    // For private channels, we use forwardMessage to the bot's own chat first,
    // or we can use the getChat + getFile approach.
    
    // Actually, for bots that are admins in channels, we can use getUpdates 
    // or the /messages endpoint. Let's try using the Bot API's 
    // copyMessage or forward approach.

    // The simplest: use Telegram's getFile with the message's video file_id.
    // But we need the file_id first. Let's use forwardMessage to get message details.

    // Step 1: Forward the message to the bot's saved messages to get file details
    // We'll forward to the same chat (the bot can read it)
    
    // Actually, the best approach for channel messages: use the 
    // Telegram Bot API method `getChat` + reading channel posts.
    // But Telegram Bot API doesn't have a "getMessage" method.
    // We need to forward the message to extract file_id.

    // Use copyMessage to forward to the bot itself (bot's chat_id = bot user id)
    // First get bot info
    const meResponse = await fetch(`${GATEWAY_URL}/getMe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
    const meData = await meResponse.json();
    if (!meResponse.ok) {
      throw new Error(`getMe failed [${meResponse.status}]: ${JSON.stringify(meData)}`);
    }
    const botChatId = meData.result.id;

    // Forward the channel message to the bot to get message details with file_id
    const fwdResponse = await fetch(`${GATEWAY_URL}/forwardMessage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chat_id: botChatId,
        from_chat_id: chatId,
        message_id: parseInt(messageId, 10),
      }),
    });
    const fwdData = await fwdResponse.json();
    if (!fwdResponse.ok) {
      throw new Error(`forwardMessage failed [${fwdResponse.status}]: ${JSON.stringify(fwdData)}`);
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
