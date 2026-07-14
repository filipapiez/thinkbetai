CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,
  sport_key text NOT NULL,
  event text NOT NULL,
  commence_time timestamptz NOT NULL,
  market text NOT NULL,
  selection text NOT NULL,
  line numeric,
  book text NOT NULL,
  odds_decimal numeric NOT NULL,
  odds_american integer NOT NULL,
  fair_prob numeric NOT NULL,
  fair_odds_decimal numeric NOT NULL,
  ev_pct numeric NOT NULL,
  edge_type text NOT NULL DEFAULT 'value',
  book_count integer NOT NULL DEFAULT 0,
  extra jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
  UNIQUE (sport_key, event, market, selection, book, line)
);
GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "opportunities_public_read" ON public.opportunities;
CREATE POLICY "opportunities_public_read" ON public.opportunities FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_opportunities_live ON public.opportunities (expires_at DESC, ev_pct DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_sport ON public.opportunities (sport_key, commence_time);