const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// We use gram.js (telegram package) for MTProto authentication
import { TelegramClient } from "npm:telegram@2.26.22";
import { StringSession } from "npm:telegram@2.26.22/sessions/index.js";
import { Api } from "npm:telegram@2.26.22/tl/index.js";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiId = parseInt(Deno.env.get('TELEGRAM_API_ID') || '0', 10);
  const apiHash = Deno.env.get('TELEGRAM_API_HASH');

  if (!apiId || !apiHash) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_API_ID or TELEGRAM_API_HASH not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { step, phone, phoneCodeHash, code, password } = body;

    if (step === 'send_code') {
      // Step 1: Send verification code to phone
      const session = new StringSession('');
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 3,
      });
      await client.connect();

      const result = await client.invoke(
        new Api.auth.SendCode({
          phoneNumber: phone,
          apiId,
          apiHash,
          settings: new Api.CodeSettings({}),
        })
      );

      // Save the session state so we can resume
      const partialSession = client.session.save() as string;
      await client.disconnect();

      return new Response(JSON.stringify({
        phoneCodeHash: result.phoneCodeHash,
        partialSession,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (step === 'verify_code') {
      // Step 2: Verify the code and get full session
      const session = new StringSession(body.partialSession || '');
      const client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 3,
      });
      await client.connect();

      try {
        await client.invoke(
          new Api.auth.SignIn({
            phoneNumber: phone,
            phoneCodeHash,
            phoneCode: code,
          })
        );
      } catch (err: any) {
        if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
          // 2FA is enabled
          if (!password) {
            const partialSession = client.session.save() as string;
            await client.disconnect();
            return new Response(JSON.stringify({
              needs2FA: true,
              partialSession,
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          // Try with password
          const passwordResult = await client.invoke(new Api.account.GetPassword());
          const srpResult = await client.invoke(
            new Api.auth.CheckPassword({
              password: await client._computePasswordSrp(passwordResult, password),
            })
          );
        } else {
          throw err;
        }
      }

      const sessionString = client.session.save() as string;
      await client.disconnect();

      return new Response(JSON.stringify({
        sessionString,
        message: 'Authentication successful! Save this session string as TELEGRAM_SESSION secret.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid step. Use "send_code" or "verify_code"' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Telegram auth error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
