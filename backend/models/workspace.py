import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class Workspace(Base):
    """
    Owned by: Fatima
    Do not create a duplicate version of this model — other modules
    should import and use this one.
    """

    __tablename__ = "workspace"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

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
    owner: Mapped["User"] = relationship(
        "User", back_populates="owned_workspaces", foreign_keys=[owner_id]
    )
    members: Mapped[list["WorkspaceMember"]] = relationship(
        "WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan"
    )

    # Cross-module relationships (folder/team live in Zainab's models).
    # Left commented out here since Zainab owns folder.py / team.py —
    # she should add the reverse side (`workspace = relationship(...)`)
    # on her end rather than this file reaching into her models.
    folders: Mapped[list["Folder"]] = relationship("Folder", back_populates="workspace")
    teams: Mapped[list["Team"]] = relationship("Team", back_populates="workspace")
