"""drop_owner_id_foreign_key

Revision ID: 4d40e1551012
Revises: a07002d392d6
Create Date: 2026-02-02 19:00:08.511253

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d40e1551012'
down_revision: Union[str, None] = 'a07002d392d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Drop the foreign key constraint on games.owner_id.
    
    Users are managed by Neon Auth (not in FastAPI database), so we cannot
    enforce a foreign key constraint. The owner_id is just a reference UUID.
    """
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # Drop the foreign key constraint if it exists
        # Use raw SQL to check and drop safely
        op.execute("""
            DO $$ 
            BEGIN
                -- Drop constraint if it exists (try common names)
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'fk_games_owner_id_user' 
                    AND conrelid = 'games'::regclass
                ) THEN
                    ALTER TABLE games DROP CONSTRAINT fk_games_owner_id_user;
                END IF;
                
                IF EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'fk_games_owner' 
                    AND conrelid = 'games'::regclass
                ) THEN
                    ALTER TABLE games DROP CONSTRAINT fk_games_owner;
                END IF;
            END $$;
        """)


def downgrade() -> None:
    """
    Note: We don't recreate the foreign key constraint because:
    1. Users are managed by Neon Auth, not in FastAPI database
    2. We don't know the exact constraint name that was originally used
    3. The constraint would fail anyway since users don't exist in FastAPI DB
    """
    pass
