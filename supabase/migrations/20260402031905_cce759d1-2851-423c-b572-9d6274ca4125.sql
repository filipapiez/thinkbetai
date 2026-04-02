DELETE FROM historical_bets
WHERE id NOT IN (
  SELECT DISTINCT ON (sport, home_team, away_team, pick, date) id
  FROM historical_bets
  ORDER BY sport, home_team, away_team, pick, date, created_at ASC
);