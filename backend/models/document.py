import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database.base import Base


class Document(Base):
    __tablename__ = "documents"

    # Rule #6: UUID for Primary Keys consistently (PostgreSQL Native UUID)
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )

    # Foreign Keys referencing Folder, Workspace (Fatima), and User (Fatima)
    folder_id = Column(
        UUID(as_uuid=True),
        ForeignKey("folders.id"),
        nullable=True,
        index=True
    )

    workspace_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workspace.id"),
        nullable=False,
        index=True
    )

    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True
    )

    # Document Attributes
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    
    is_favorite = Column(
        Boolean,
        default=False,
        nullable=False
    )

    is_archived = Column(
        Boolean,
        default=False,
        nullable=False
    )

    # UTC Timestamps as per Rule #6
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Internal Relationships (Zainab's ownership)
    folder = relationship(
        "Folder",
        back_populates="documents"
    )

    attachments = relationship(
        "DocumentAttachment",
        back_populates="document",
        cascade="all, delete-orphan"
    )

    # External Relationships (Other Team Members' modules)
    workspace = relationship(
        "Workspace",
        back_populates="documents"
    )  # Owned by Fatima

    owner = relationship(
        "User",
        back_populates="documents"
    )  # Owned by Fatima

    versions = relationship(
        "DocumentVersion",
        back_populates="document",
        cascade="all, delete-orphan"
    )  # Owned by Sayeel

    comments = relationship(
        "Comment",
        back_populates="document",
        cascade="all, delete-orphan"
    )  # Owned by Sayeel

    permissions = relationship(
        "Permission",
        back_populates="document",
        cascade="all, delete-orphan"
    )  # Owned by Taha