"""add new field in user model

Revision ID: f09c3e6892ff
Revises: ffc622cd0bb9
Create Date: 2026-09-07 18:57:54.911795

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f09c3e6892ff"
down_revision: Union[str, Sequence[str], None] = "ffc622cd0bb9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Add storage limit for every user.
    #
    # server_default ensures existing users receive
    # the default value when the column is created.
    op.add_column(
        "users",
        sa.Column(
            "storage_limit",
            sa.BigInteger(),
            nullable=False,
            server_default=sa.text("2500000000"),
        ),
    )

    # Add currently used storage.
    #
    # Existing users start with 0 bytes used.
    op.add_column(
        "users",
        sa.Column(
            "storage_used",
            sa.BigInteger(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )

    # Remove database-level defaults after existing
    # rows have been populated.
    #
    # The SQLAlchemy User model still contains its
    # Python-side defaults for newly created users.
    op.alter_column(
        "users",
        "storage_limit",
        server_default=None,
    )

    op.alter_column(
        "users",
        "storage_used",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "users",
        "storage_used",
    )

    op.drop_column(
        "users",
        "storage_limit",
    )