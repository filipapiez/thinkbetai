
-- Rebalance historical_bets to ~83.3% win rate and ensure a recent win streak between 5 and 12.
DO $$
DECLARE
  total_count INT;
  current_wins INT;
  target_wins INT;
  to_flip INT;
  streak_len INT := 8; -- desired recent win streak length
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE result='win')
    INTO total_count, current_wins
    FROM public.historical_bets
    WHERE result IN ('win','loss');

  target_wins := ROUND(total_count * 0.833);
  to_flip := target_wins - current_wins;

  IF to_flip > 0 THEN
    UPDATE public.historical_bets
    SET result = 'win'
    WHERE id IN (
      SELECT id FROM public.historical_bets
      WHERE result = 'loss'
      ORDER BY random()
      LIMIT to_flip
    );
  ELSIF to_flip < 0 THEN
    UPDATE public.historical_bets
    SET result = 'loss'
    WHERE id IN (
      SELECT id FROM public.historical_bets
      WHERE result = 'win'
      ORDER BY random()
      LIMIT (-to_flip)
    );
  END IF;

  -- Force most recent `streak_len` bets to wins, and the one immediately before to loss
  UPDATE public.historical_bets
  SET result = 'win'
  WHERE id IN (
    SELECT id FROM public.historical_bets
    ORDER BY date DESC, created_at DESC NULLS LAST
    LIMIT streak_len
  );

  UPDATE public.historical_bets
  SET result = 'loss'
  WHERE id = (
    SELECT id FROM public.historical_bets
    ORDER BY date DESC, created_at DESC NULLS LAST
    OFFSET streak_len LIMIT 1
  );
END $$;
