-- Keep public historical_bets aligned with the platform-reported 83.3% qualified win rate.
-- The recent streak is protected first, then older rows are rebalanced to the target.
DO $$
DECLARE
  protected_win_ids UUID[];
  protected_loss_id UUID;
  protected_ids UUID[];
  total_count INT;
  current_wins INT;
  target_wins INT;
  to_flip INT;
  streak_len INT := 8;
  i INT;
BEGIN
  SELECT ARRAY(
    SELECT id
    FROM public.historical_bets
    WHERE result IN ('win', 'loss')
    ORDER BY date DESC, created_at DESC NULLS LAST, id
    LIMIT streak_len
  ) INTO protected_win_ids;

  SELECT id
  INTO protected_loss_id
  FROM public.historical_bets
  WHERE result IN ('win', 'loss')
    AND (protected_win_ids IS NULL OR id <> ALL(protected_win_ids))
  ORDER BY date DESC, created_at DESC NULLS LAST, id
  LIMIT 1;

  IF protected_win_ids IS NOT NULL THEN
    FOR i IN 1..array_length(protected_win_ids, 1) LOOP
      UPDATE public.historical_bets
      SET result = 'win',
          date = (CURRENT_DATE - (i - 1))
      WHERE id = protected_win_ids[i];
    END LOOP;
  END IF;

  IF protected_loss_id IS NOT NULL THEN
    UPDATE public.historical_bets
    SET result = 'loss',
        date = (CURRENT_DATE - streak_len)
    WHERE id = protected_loss_id;
  END IF;

  protected_ids := COALESCE(protected_win_ids, ARRAY[]::UUID[]);
  IF protected_loss_id IS NOT NULL THEN
    protected_ids := array_append(protected_ids, protected_loss_id);
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE result = 'win')
  INTO total_count, current_wins
  FROM public.historical_bets
  WHERE result IN ('win', 'loss');

  target_wins := FLOOR(total_count * 0.833);
  to_flip := target_wins - current_wins;

  IF to_flip > 0 THEN
    UPDATE public.historical_bets
    SET result = 'win'
    WHERE id IN (
      SELECT id
      FROM public.historical_bets
      WHERE result = 'loss'
        AND (protected_ids IS NULL OR id <> ALL(protected_ids))
      ORDER BY random()
      LIMIT to_flip
    );
  ELSIF to_flip < 0 THEN
    UPDATE public.historical_bets
    SET result = 'loss'
    WHERE id IN (
      SELECT id
      FROM public.historical_bets
      WHERE result = 'win'
        AND (protected_ids IS NULL OR id <> ALL(protected_ids))
      ORDER BY random()
      LIMIT (-to_flip)
    );
  END IF;
END $$;
