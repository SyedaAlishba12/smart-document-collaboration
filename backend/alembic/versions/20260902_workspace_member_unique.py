"""add workspace membership uniqueness

Revision ID: 20260902_workspace_member_unique
Revises: a9a027065f60
"""
from alembic import op

revision = "20260902_workspace_member_unique"
down_revision = "a9a027065f60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_workspace_member_workspace_user",
        "workspace_member",
        ["workspace_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_workspace_member_workspace_user",
        "workspace_member",
        type_="unique",
    )
