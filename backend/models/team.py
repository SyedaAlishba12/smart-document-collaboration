import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database.base import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id"),
        nullable=False,
        index=True
    )
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
)

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
)
    # Relationships
    workspace = relationship("Workspace", back_populates="teams")
    team_members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")