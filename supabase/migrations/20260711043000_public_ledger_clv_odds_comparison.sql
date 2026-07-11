-- Add public audit fields for pick-ledger transparency, CLV tracking,
-- closing-line snapshots, per-book odds proof, and verified review intake.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

ALTER TABLE public.active_bets
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bookmaker TEXT,
  ADD COLUMN IF NOT EXISTS market_type TEXT,
  ADD COLUMN IF NOT EXISTS line NUMERIC,
  ADD COLUMN IF NOT EXISTS opening_odds INTEGER,
  ADD COLUMN IF NOT EXISTS pick_odds INTEGER,
  ADD COLUMN IF NOT EXISTS closing_odds INTEGER,
  ADD COLUMN IF NOT EXISTS closing_line NUMERIC,
  ADD COLUMN IF NOT EXISTS closing_bookmaker TEXT,
  ADD COLUMN IF NOT EXISTS closing_captured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS model_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS implied_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS expected_value NUMERIC,
  ADD COLUMN IF NOT EXISTS clv_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS clv_cents NUMERIC,
  ADD COLUMN IF NOT EXISTS source_event_id TEXT,
  ADD COLUMN IF NOT EXISTS odds_source TEXT;

ALTER TABLE public.historical_bets
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bookmaker TEXT,
  ADD COLUMN IF NOT EXISTS market_type TEXT,
  ADD COLUMN IF NOT EXISTS line NUMERIC,
  ADD COLUMN IF NOT EXISTS opening_odds INTEGER,
  ADD COLUMN IF NOT EXISTS pick_odds INTEGER,
  ADD COLUMN IF NOT EXISTS closing_odds INTEGER,
  ADD COLUMN IF NOT EXISTS closing_line NUMERIC,
  ADD COLUMN IF NOT EXISTS closing_bookmaker TEXT,
  ADD COLUMN IF NOT EXISTS closing_captured_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS model_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS implied_probability NUMERIC,
  ADD COLUMN IF NOT EXISTS expected_value NUMERIC,
  ADD COLUMN IF NOT EXISTS clv_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS clv_cents NUMERIC,
  ADD COLUMN IF NOT EXISTS source_event_id TEXT,
  ADD COLUMN IF NOT EXISTS odds_source TEXT;

UPDATE public.active_bets
SET
  published_at = COALESCE(published_at, created_at),
  market_type = COALESCE(market_type, pick_type),
  opening_odds = COALESCE(opening_odds, odds),
  pick_odds = COALESCE(pick_odds, odds),
  source_event_id = COALESCE(source_event_id, game_id),
  odds_source = COALESCE(odds_source, 'legacy')
WHERE
  published_at IS NULL
  OR market_type IS NULL
  OR opening_odds IS NULL
  OR pick_odds IS NULL
  OR source_event_id IS NULL
  OR odds_source IS NULL;

UPDATE public.historical_bets
SET
  published_at = COALESCE(published_at, created_at),
  market_type = COALESCE(market_type, 'moneyline'),
  opening_odds = COALESCE(opening_odds, odds),
  pick_odds = COALESCE(pick_odds, odds),
  odds_source = COALESCE(odds_source, 'legacy')
WHERE
  published_at IS NULL
  OR market_type IS NULL
  OR opening_odds IS NULL
  OR pick_odds IS NULL
  OR odds_source IS NULL;

CREATE TABLE IF NOT EXISTS public.odds_closing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active_bet_id UUID REFERENCES public.active_bets(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  bookmaker TEXT NOT NULL,
  market_type TEXT NOT NULL,
  line NUMERIC,
  odds INTEGER NOT NULL,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.odds_closing_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view closing snapshots"
ON public.odds_closing_snapshots
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage closing snapshots"
ON public.odds_closing_snapshots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.public_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  quote TEXT NOT NULL CHECK (char_length(quote) BETWEEN 20 AND 600),
  source TEXT NOT NULL DEFAULT 'in_app',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.public_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reviews"
ON public.public_reviews
FOR SELECT
USING (is_published = true);

CREATE POLICY "Authenticated users can submit unpublished reviews"
ON public.public_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND is_published = false
  AND is_verified = false
);

CREATE POLICY "Admins can manage public reviews"
ON public.public_reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_public_reviews_updated_at
BEFORE UPDATE ON public.public_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_active_bets_public_audit
ON public.active_bets (status, game_time, published_at);

CREATE INDEX IF NOT EXISTS idx_historical_bets_public_audit
ON public.historical_bets (date DESC, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_historical_bets_clv
ON public.historical_bets (clv_percent DESC)
WHERE clv_percent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_odds_closing_snapshots_bet
ON public.odds_closing_snapshots (active_bet_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_odds_closing_snapshots_game
ON public.odds_closing_snapshots (game_id, sport, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_public_reviews_published
ON public.public_reviews (is_published, is_verified, created_at DESC);

DO $$
DECLARE
  existing_job record;
BEGIN
  FOR existing_job IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('capture-closing-lines')
  LOOP
    PERFORM cron.unschedule(existing_job.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'capture-closing-lines',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fmrcmbdgmhoylmxbapdr.supabase.co/functions/v1/capture-closing-lines',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET')
    ),
    body := '{"source": "cron"}'::jsonb
  );
  $$
);
