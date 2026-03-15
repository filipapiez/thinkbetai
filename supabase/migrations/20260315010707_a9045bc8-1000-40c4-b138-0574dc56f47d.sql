
CREATE TABLE public.admin_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_type text NOT NULL DEFAULT 'game',
  sport text NOT NULL DEFAULT 'NBA',
  home_team text,
  away_team text,
  player_name text,
  prop_type text,
  line numeric,
  direction text,
  pick text NOT NULL,
  odds integer DEFAULT -110,
  confidence integer DEFAULT 70,
  notes text,
  game_date date,
  result text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on admin_picks"
  ON public.admin_picks
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
