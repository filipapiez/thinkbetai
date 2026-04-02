CREATE UNIQUE INDEX IF NOT EXISTS idx_historical_bets_unique_game_pick 
ON historical_bets (sport, home_team, away_team, pick, date);