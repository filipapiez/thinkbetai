
-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Daily cron: check game results at 6 AM UTC
SELECT cron.schedule(
  'daily-check-game-results',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fmrcmbdgmhoylmxbapdr.supabase.co/functions/v1/check-game-results',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcmNtYmRnbWhveWxteGJhcGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODE3MDcsImV4cCI6MjA4MzI1NzcwN30.iJQd0C189JcxiLxV4CjTp30SBQ7mULmPv88k2CRQqJA"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);

-- Daily cron: sync bet history 30 min later (6:30 AM UTC) to allow results to process
SELECT cron.schedule(
  'daily-sync-bet-history',
  '30 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fmrcmbdgmhoylmxbapdr.supabase.co/functions/v1/sync-bet-history',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcmNtYmRnbWhveWxteGJhcGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODE3MDcsImV4cCI6MjA4MzI1NzcwN30.iJQd0C189JcxiLxV4CjTp30SBQ7mULmPv88k2CRQqJA"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) AS request_id;
  $$
);
