const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { TelegramClient } from "npm:telegram@2.26.22";
import { StringSession } from "npm:telegram@2.26.22/sessions/index.js";
import { Api } from "npm:telegram@2.26.22/tl/index.js";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiId = parseInt(Deno.env.get('TELEGRAM_API_ID') || '0', 10);
  const apiHash = Deno.env.get('TELEGRAM_API_HASH');
  const sessionString = Deno.env.get('TELEGRAM_SESSION');

  if (!apiId || !apiHash) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_ID or TELEGRAM_API_HASH not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!sessionString) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_SESSION not configured. Run telegram-auth first.' }), {
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

    // Connect via MTProto
    const session = new StringSession(sessionString);
    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 3,
    });
    await client.connect();

    try {
      // Parse channel ID - remove the -100 prefix for MTProto
      let channelId = chatId.toString();
      if (channelId.startsWith('-100')) {
        channelId = channelId.slice(4);
      } else if (channelId.startsWith('-')) {
        channelId = channelId.slice(1);
      }

      // Get the message from the channel
      const result = await client.invoke(
        new Api.channels.GetMessages({
          channel: channelId,
          id: [new Api.InputMessageID({ id: parseInt(messageId, 10) })],
        })
      );

      const messages = result.messages;
      if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ error: 'Message not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const message = messages[0];
      if (!message.media) {
        return new Response(JSON.stringify({ error: 'No media found in this message' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Download the media file using MTProto (no size limit!)
      const buffer = await client.downloadMedia(message.media, {});

      if (!buffer) {
        return new Response(JSON.stringify({ error: 'Failed to download media' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Determine content type
      let contentType = 'video/mp4';
      if (message.media instanceof Api.MessageMediaDocument && message.media.document) {
        const doc = message.media.document;
        if (doc instanceof Api.Document) {
          contentType = doc.mimeType || 'video/mp4';
        }
      }

      const fileBytes = buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);

      return new Response(fileBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Length': fileBytes.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });

    } finally {
      await client.disconnect();
    }

  } catch (error: unknown) {
    console.error('Telegram video proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
