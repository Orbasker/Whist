"""Initial migration

Revision ID: a07002d392d6
Revises: 
Create Date: 2026-02-01 18:52:35.280294

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'a07002d392d6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types for PostgreSQL only
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # Drop existing types if they exist (cleanup)
        op.execute('DROP TYPE IF EXISTS gamestatus CASCADE')
        op.execute('DROP TYPE IF EXISTS gamemode CASCADE')
        # Create enum types
        op.execute("CREATE TYPE gamestatus AS ENUM ('ACTIVE', 'COMPLETED', 'SHARED')")
        op.execute("CREATE TYPE gamemode AS ENUM ('SCORING_ONLY', 'FULL_REMOTE', 'HYBRID')")
    
    # Create tables - use VARCHAR for SQLite, ENUM for PostgreSQL
    if bind.dialect.name == 'postgresql':
        from sqlalchemy.dialects import postgresql
        status_type = postgresql.ENUM('ACTIVE', 'COMPLETED', 'SHARED', name='gamestatus', create_type=False)
        mode_type = postgresql.ENUM('SCORING_ONLY', 'FULL_REMOTE', 'HYBRID', name='gamemode', create_type=False)
    else:
        status_type = sa.String()
        mode_type = sa.String()
    
    op.create_table('games',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('players', sa.JSON(), nullable=False),
    sa.Column('scores', sa.JSON(), nullable=False),
    sa.Column('current_round', sa.Integer(), nullable=False),
    sa.Column('status', status_type, nullable=False),
    sa.Column('owner_id', sa.UUID(), nullable=True),
    sa.Column('name', sa.String(), nullable=True),
    sa.Column('player_user_ids', sa.JSON(), nullable=True),
    sa.Column('is_shared', sa.Boolean(), nullable=True),
    sa.Column('share_code', sa.String(), nullable=True),
    sa.Column('game_mode', mode_type, nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('share_code')
    )
    op.create_table('rounds',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('game_id', sa.UUID(), nullable=False),
    sa.Column('round_number', sa.Integer(), nullable=False),
    sa.Column('bids', sa.JSON(), nullable=False),
    sa.Column('tricks', sa.JSON(), nullable=False),
    sa.Column('scores', sa.JSON(), nullable=False),
    sa.Column('round_mode', sa.String(), nullable=False),
    sa.Column('trump_suit', sa.String(), nullable=True),
    sa.Column('created_by', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['game_id'], ['games.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('rounds')
    op.drop_table('games')
    
    # Drop enum types for PostgreSQL only
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute('DROP TYPE IF EXISTS gamestatus')
        op.execute('DROP TYPE IF EXISTS gamemode')
