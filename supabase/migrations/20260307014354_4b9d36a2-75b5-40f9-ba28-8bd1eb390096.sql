DELETE FROM odds_cache WHERE id LIKE 'player-log:%' AND (
  data->>'statValues' IS NULL 
  OR jsonb_array_length(data->'statValues') < 10
);