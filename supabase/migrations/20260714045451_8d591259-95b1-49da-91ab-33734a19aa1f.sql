
CREATE TABLE public.odds_board_latest (
  id                uuid primary key default gen_random_uuid(),
  dedup_key         text not null unique,
  odds_api_event_id text not null,
  sport             text not null,
  event             text not null,
  commence_time     timestamptz not null,
  market            text not null,
  book              text not null,
  outcome           text not null,
  point             numeric,
  price             numeric(8,4) not null,
  opening_point     numeric,
  opening_price     numeric(8,4) not null,
  updated_at        timestamptz not null default now()
);

CREATE INDEX obl_event_idx    ON public.odds_board_latest (odds_api_event_id, market);
CREATE INDEX obl_commence_idx ON public.odds_board_latest (commence_time);
CREATE INDEX obl_sport_idx    ON public.odds_board_latest (sport, market);

GRANT SELECT ON public.odds_board_latest TO anon, authenticated;
GRANT ALL ON public.odds_board_latest TO service_role;

ALTER TABLE public.odds_board_latest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read odds board" ON public.odds_board_latest FOR SELECT USING (true);

CREATE TABLE public.odds_history (
  id                bigint generated always as identity primary key,
  dedup_key         text not null,
  odds_api_event_id text not null,
  market            text not null,
  book              text not null,
  outcome           text not null,
  old_point         numeric,
  new_point         numeric,
  old_price         numeric(8,4),
  new_price         numeric(8,4),
  changed_at        timestamptz not null default now()
);

CREATE INDEX oh_key_idx ON public.odds_history (dedup_key, changed_at DESC);

GRANT SELECT ON public.odds_history TO anon, authenticated;
GRANT ALL ON public.odds_history TO service_role;

ALTER TABLE public.odds_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read odds history" ON public.odds_history FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.capture_odds_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.opening_price := OLD.opening_price;
  NEW.opening_point := OLD.opening_point;

  IF NEW.price IS DISTINCT FROM OLD.price OR NEW.point IS DISTINCT FROM OLD.point THEN
    INSERT INTO public.odds_history
      (dedup_key, odds_api_event_id, market, book, outcome,
       old_point, new_point, old_price, new_price)
    VALUES
      (OLD.dedup_key, OLD.odds_api_event_id, OLD.market, OLD.book, OLD.outcome,
       OLD.point, NEW.point, OLD.price, NEW.price);
    NEW.updated_at := now();
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER odds_change_capture
  BEFORE UPDATE ON public.odds_board_latest
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_odds_change();

CREATE OR REPLACE FUNCTION public.prune_odds_board()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.odds_board_latest WHERE commence_time < now() - interval '1 day';
  DELETE FROM public.odds_history WHERE changed_at < now() - interval '7 days';
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.odds_board_latest;
ALTER TABLE public.odds_board_latest REPLICA IDENTITY FULL;
