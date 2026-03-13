CREATE TABLE public.team_logos_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  sport text,
  logo_url text,
  source text DEFAULT 'thesportsdb',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_name, sport)
);

ALTER TABLE public.team_logos_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read team logos" ON public.team_logos_cache
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role can manage team logos" ON public.team_logos_cache
  FOR ALL USING (true) WITH CHECK (true);