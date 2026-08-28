import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class WorkspaceMember(Base):
    """
    Owned by: Fatima
    Do not create a duplicate version of this model — other modules
    should import and use this one.
    """

    __tablename__ = "workspace_member"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspace.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id"), nullable=False, index=True
    )

    # NOTE: free-text per the ERD, unlike permission.permission_level
    # which is a proper enum. Fine to leave as-is since you're not
    # flagging ERD changes, but keep values consistent (e.g. "owner",
    # "admin", "member") across create/invite endpoints.
    role: Mapped[str] = mapped_column(String, nullable=False)

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="workspace_memberships")