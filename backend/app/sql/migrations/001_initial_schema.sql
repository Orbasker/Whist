-- Initial database schema migration
-- This file can be used for manual database setup or as reference for Alembic

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    name VARCHAR,
    players JSON NOT NULL,
    player_user_ids JSON,
    scores JSON NOT NULL,
    current_round INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'active',
    is_shared BOOLEAN DEFAULT false,
    share_code VARCHAR UNIQUE,
    game_mode VARCHAR DEFAULT 'scoring_only',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rounds table
CREATE TABLE rounds (
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

-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_owner ON games(owner_id);
CREATE INDEX idx_games_share_code ON games(share_code);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_rounds_game_id ON rounds(game_id);
CREATE INDEX idx_rounds_game_round ON rounds(game_id, round_number);
CREATE INDEX idx_rounds_created_at ON rounds(created_at DESC);
CREATE INDEX idx_games_status_created ON games(status, created_at DESC);
CREATE INDEX idx_rounds_mode_suit ON rounds(round_mode, trump_suit);
