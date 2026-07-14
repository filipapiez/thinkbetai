
ALTER TABLE public.odds_board_latest ADD COLUMN IF NOT EXISTS bet_link text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS bet_link text;
