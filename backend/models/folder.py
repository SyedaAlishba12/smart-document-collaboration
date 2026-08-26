import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database.base import Base

class Folder(Base):
    __tablename__ = "folders"

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
    parent_folder_id = Column(
        UUID(as_uuid=True),
        ForeignKey("folders.id"),
        nullable=True,
        index=True
    )
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="folders")
    parent_folder = relationship("Folder", remote_side=[id], back_populates="sub_folders")
    sub_folders = relationship("Folder", back_populates="parent_folder", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="folder", cascade="all, delete-orphan")