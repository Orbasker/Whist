-- Round table definition

CREATE TABLE IF NOT EXISTS rounds (
    id SERIAL PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    bids JSON NOT NULL,
    tricks JSON NOT NULL,
    scores JSON NOT NULL,
    round_mode VARCHAR NOT NULL,
    trump_suit VARCHAR,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_round_mode CHECK (round_mode IN ('over', 'under')),
    CONSTRAINT chk_trump_suit CHECK (
        trump_suit IS NULL OR 
        trump_suit IN ('spades', 'clubs', 'diamonds', 'hearts', 'no-trump')
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rounds_game_id ON rounds(game_id);
CREATE INDEX IF NOT EXISTS idx_rounds_game_round ON rounds(game_id, round_number);
CREATE INDEX IF NOT EXISTS idx_rounds_created_at ON rounds(created_at DESC);
