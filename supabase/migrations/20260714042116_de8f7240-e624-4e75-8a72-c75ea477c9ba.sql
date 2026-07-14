
-- =============================================================
-- Proof page: picks table + proof_stats view + backfill
-- =============================================================

CREATE TYPE public.pick_result AS ENUM ('pending', 'win', 'loss', 'push', 'void');

CREATE TABLE public.picks (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  posted_at             timestamptz NOT NULL DEFAULT now(),
  sport                 text NOT NULL,
  event                 text NOT NULL,
  market                text NOT NULL,
  selection             text NOT NULL,
  book                  text,
  odds_decimal          numeric(8,4) NOT NULL CHECK (odds_decimal > 1),
  fair_prob             numeric(6,5) NOT NULL CHECK (fair_prob > 0 AND fair_prob < 1),
  stake_units           numeric(6,2) NOT NULL DEFAULT 1.0 CHECK (stake_units > 0),
  closing_odds_decimal  numeric(8,4) CHECK (closing_odds_decimal > 1),
  result                public.pick_result NOT NULL DEFAULT 'pending',
  settled_at            timestamptz,
  is_published          boolean NOT NULL DEFAULT true,

  ev_pct numeric(8,4) GENERATED ALWAYS AS (
    round(((fair_prob * odds_decimal) - 1) * 100, 4)
  ) STORED,
  clv_pct numeric(8,4) GENERATED ALWAYS AS (
    CASE WHEN closing_odds_decimal IS NOT NULL
      THEN round(((odds_decimal / closing_odds_decimal) - 1) * 100, 4)
      ELSE NULL END
  ) STORED,
  pl_units numeric(10,4) GENERATED ALWAYS AS (
    CASE result
      WHEN 'win'  THEN round(stake_units * (odds_decimal - 1), 4)
      WHEN 'loss' THEN -stake_units
      ELSE 0
    END
  ) STORED
);

CREATE INDEX picks_posted_at_idx ON public.picks (posted_at DESC);
CREATE INDEX picks_sport_idx     ON public.picks (sport);
CREATE INDEX picks_result_idx    ON public.picks (result);

GRANT SELECT ON public.picks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.picks TO authenticated;
GRANT ALL ON public.picks TO service_role;

ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published picks"
  ON public.picks FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can insert picks"
  ON public.picks FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update picks"
  ON public.picks FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete picks"
  ON public.picks FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Aggregate stats view
CREATE OR REPLACE VIEW public.proof_stats AS
WITH settled AS (
  SELECT *,
    CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END AS outcome,
    (1.0 / closing_odds_decimal) AS closing_implied_prob
  FROM public.picks
  WHERE is_published
    AND result IN ('win', 'loss')
)
SELECT
  count(*)::int                                          AS graded_picks,
  count(*) FILTER (WHERE result = 'win')::int            AS wins,
  count(*) FILTER (WHERE result = 'loss')::int           AS losses,
  round(avg(CASE WHEN result = 'win' THEN 1.0 ELSE 0 END) * 100, 2) AS win_rate_pct,
  round(sum(pl_units), 2)                                AS net_units,
  round(sum(pl_units) / nullif(sum(stake_units), 0) * 100, 2) AS roi_pct,
  round(avg(clv_pct), 3)                                 AS avg_clv_pct,
  round(avg(power(fair_prob - outcome, 2))::numeric, 5)  AS model_brier,
  round(avg(power(closing_implied_prob - outcome, 2)) FILTER (WHERE closing_odds_decimal IS NOT NULL)::numeric, 5) AS closing_brier
FROM settled;

GRANT SELECT ON public.proof_stats TO anon, authenticated;

-- =============================================================
-- Backfill from historical_bets
-- =============================================================
INSERT INTO public.picks
  (posted_at, sport, event, market, selection, book,
   odds_decimal, fair_prob, stake_units, result, settled_at, is_published)
SELECT
  (hb.date::timestamptz)                                                AS posted_at,
  hb.sport                                                              AS sport,
  hb.away_team || ' @ ' || hb.home_team                                 AS event,
  CASE
    WHEN hb.pick ~* '(^|\s)(ml|moneyline)(\s|$)'         THEN 'Moneyline'
    WHEN hb.pick ~* '(over|under|\bo\b|\bu\b)\s*\d'      THEN 'Total'
    WHEN hb.pick ~* '[+-]\s*\d'                          THEN 'Spread'
    ELSE 'Moneyline'
  END                                                                    AS market,
  hb.pick                                                                AS selection,
  NULL::text                                                             AS book,
  CASE
    WHEN hb.odds > 0 THEN round((1 + hb.odds::numeric / 100.0)::numeric, 4)
    WHEN hb.odds < 0 THEN round((1 + 100.0 / abs(hb.odds)::numeric)::numeric, 4)
    ELSE 2.0000
  END                                                                    AS odds_decimal,
  LEAST(0.99, GREATEST(0.01, hb.confidence::numeric / 100.0))            AS fair_prob,
  1.0                                                                    AS stake_units,
  hb.result::public.pick_result                                          AS result,
  hb.created_at                                                          AS settled_at,
  true                                                                   AS is_published
FROM public.historical_bets hb
WHERE hb.result IN ('win', 'loss');
