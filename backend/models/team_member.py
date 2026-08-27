import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database.base import Base

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    team_id = Column(
        UUID(as_uuid=True),
        ForeignKey("teams.id"),
        nullable=False,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True
    )
    role = Column(String(50), nullable=False, default="member")
    joined_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
)
    # Relationships
    team = relationship("Team", back_populates="team_members")
    user = relationship("User", back_populates="team_members")