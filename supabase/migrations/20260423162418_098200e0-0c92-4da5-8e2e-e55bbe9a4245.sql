CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule with the same name
DO $$
BEGIN
  PERFORM cron.unschedule('dropbox-sync-every-5-min');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'dropbox-sync-every-5-min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bxdmtgzsdhrxfsacwytz.supabase.co/functions/v1/dropbox-sync',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);