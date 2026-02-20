"""add_performance_indexes

Revision ID: 6b2c3d4e5f6a
Revises: 5a1b2c3d4e5f
Create Date: 2026-02-20

Add indexes to speed up list_games (owner_id, created_at) and
rounds by game (game_id, round_number).
"""
from typing import Sequence, Union

from alembic import op


revision: str = "6b2c3d4e5f6a"
down_revision: Union[str, None] = "5a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # List games by user: filter by owner_id, sort by created_at
    op.create_index("ix_games_owner_id", "games", ["owner_id"], unique=False)
    op.create_index("ix_games_created_at", "games", ["created_at"], unique=False)
    # Get rounds by game, order by round_number
    op.create_index(
        "ix_rounds_game_id_round_number", "rounds", ["game_id", "round_number"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_rounds_game_id_round_number", table_name="rounds")
    op.drop_index("ix_games_created_at", table_name="games")
    op.drop_index("ix_games_owner_id", table_name="games")
