"""reset_vote_columns

Revision ID: 5a1b2c3d4e5f
Revises: 4d40e1551012
Create Date: 2026-02-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5a1b2c3d4e5f"
down_revision: Union[str, None] = "4d40e1551012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "games", sa.Column("reset_requested_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("games", sa.Column("reset_vote_user_ids", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("games", "reset_vote_user_ids")
    op.drop_column("games", "reset_requested_at")
