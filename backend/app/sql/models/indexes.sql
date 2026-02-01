-- Additional indexes for complex queries

-- Composite index for game queries
CREATE INDEX IF NOT EXISTS idx_games_status_created 
ON games(status, created_at DESC);

-- Index for round statistics
CREATE INDEX IF NOT EXISTS idx_rounds_mode_suit 
ON rounds(round_mode, trump_suit);

-- GIN index for JSON queries (PostgreSQL only)
-- Note: SQLite doesn't support GIN indexes, so these are commented for compatibility
-- CREATE INDEX IF NOT EXISTS idx_games_players_gin 
-- ON games USING GIN (players);

-- CREATE INDEX IF NOT EXISTS idx_rounds_bids_gin 
-- ON rounds USING GIN (bids);

-- CREATE INDEX IF NOT EXISTS idx_rounds_tricks_gin 
-- ON rounds USING GIN (tricks);
