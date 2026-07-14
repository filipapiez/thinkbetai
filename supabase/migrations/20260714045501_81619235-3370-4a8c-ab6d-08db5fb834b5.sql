
REVOKE EXECUTE ON FUNCTION public.prune_odds_board() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_odds_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.prune_odds_board() TO service_role;
GRANT EXECUTE ON FUNCTION public.capture_odds_change() TO service_role;
