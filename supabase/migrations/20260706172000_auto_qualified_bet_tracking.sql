-- Make automatic qualified-pick tracking idempotent and schedule it safely.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY sport, home_team, away_team, pick, game_time
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.active_bets
)
DELETE FROM public.active_bets
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_active_bets_unique_game_pick
ON public.active_bets (sport, home_team, away_team, pick, game_time);

DO $$
DECLARE
  existing_job record;
BEGIN
  FOR existing_job IN
    SELECT jobid FROM cron.job
    WHERE jobname IN (
      'daily-check-game-results',
      'daily-sync-bet-history',
      'sync-qualified-bets',
      'check-qualified-bet-results'
    )
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'sync-qualified-bets',
  '17 */4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fmrcmbdgmhoylmxbapdr.supabase.co/functions/v1/sync-bet-history',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')
    ),
    body := '{"source": "cron"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'check-qualified-bet-results',
  '27 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fmrcmbdgmhoylmxbapdr.supabase.co/functions/v1/check-game-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')
    ),
    body := '{"source": "cron"}'::jsonb
  );
  $$
);
