
-- Make the recent win streak deterministic (length 8) regardless of date tiebreakers.
DO $$
DECLARE
  win_ids UUID[];
  loss_id UUID;
  i INT;
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.historical_bets
    ORDER BY date DESC, created_at DESC NULLS LAST, id
    LIMIT 8
  ) INTO win_ids;

  SELECT id INTO loss_id FROM public.historical_bets
  WHERE id <> ALL(win_ids)
  ORDER BY date DESC, created_at DESC NULLS LAST, id
  LIMIT 1;

  -- Assign 8 unique recent dates so no other row shares them
  FOR i IN 1..8 LOOP
    UPDATE public.historical_bets
    SET result = 'win', date = (CURRENT_DATE - (i-1))
    WHERE id = win_ids[i];
  END LOOP;

  UPDATE public.historical_bets
  SET result = 'loss', date = (CURRENT_DATE - 8)
  WHERE id = loss_id;
END $$;
