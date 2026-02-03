-- Game table definition (for reference and migrations)

CREATE TABLE IF NOT EXISTS games (
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_owner ON games(owner_id);
CREATE INDEX IF NOT EXISTS idx_games_share_code ON games(share_code);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Phase 2: Foreign key (commented for Phase 1)
-- Note: owner_id references Neon Auth users, not a local users table
-- ALTER TABLE games 
-- ADD CONSTRAINT fk_games_owner 
-- FOREIGN KEY (owner_id) REFERENCES "user"(id) ON DELETE SET NULL;
