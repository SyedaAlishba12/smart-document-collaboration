import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class User(Base):
    """
    Owned by: Fatima
    Do not create a duplicate version of this model — other modules
    should import and use this one.
    """

    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owned_workspaces: Mapped[list["Workspace"]] = relationship(
        "Workspace", back_populates="owner", foreign_keys="Workspace.owner_id"
    )
    workspace_memberships: Mapped[list["WorkspaceMember"]] = relationship(
        "WorkspaceMember", back_populates="user"
    )
    files: Mapped[list["File"]] = relationship(
        "File", back_populates="uploader"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="owner"
    )
    team_members: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="user"
    )