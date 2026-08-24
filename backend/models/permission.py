"""
Permission model — owns access-control records for resources.

OPEN QUESTION (design review):
    spec explicitly mentions document sharing/permissions; folder-level
    permissions are included here under resource_type="folder" based on the
    reasonable assumption that folder sharing will mirror document sharing.
    If the team decides folders are workspace-scoped only (no per-user grants),
    remove "folder" from ResourceType and drop the related routes later.

FK CONSTRAINTS NOT ENFORCED YET:
    - resource_id  -> Document.id or Folder.id (depending on resource_type)
                     Tables live on teammates' branches; FK DDL added once the
                     shared skeleton is merged.
    - user_id      -> User.id   (same reason)
    - granted_by   -> User.id   (same reason)
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class ResourceType(str, enum.Enum):
    document = "document"
    folder = "folder"


class PermissionLevel(str, enum.Enum):
    owner = "owner"
    editor = "editor"
    commenter = "commenter"
    viewer = "viewer"


class SharingScope(str, enum.Enum):
    private = "private"
    workspace = "workspace"
    anyone_with_link = "anyone_with_link"


class Permission(Base):
    """
    Stores a single access-control grant for a user on a resource.

    One row = one (user, resource, level) tuple.  Multiple rows for the same
    resource represent different users with different permission levels.
    """

    __tablename__ = "permissions"

    # -- Primary key -----------------------------------------------------------
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )

    # -- Resource being protected ----------------------------------------------
    resource_type: Mapped[ResourceType] = mapped_column(
        Enum(ResourceType, name="resource_type_enum"),
        nullable=False,
        index=True,
    )

    # FK comment only -- references Document.id or Folder.id depending on
    # resource_type.  Enforced once those tables land on this branch.
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # -- Who holds this permission ---------------------------------------------
    # FK comment only -- references User.id.
    # Enforced once the User table lands on this branch.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # -- What they can do -----------------------------------------------------
    permission_level: Mapped[PermissionLevel] = mapped_column(
        Enum(PermissionLevel, name="permission_level_enum"),
        nullable=False,
    )

    # -- How broadly the resource is shared -----------------------------------
    sharing_scope: Mapped[SharingScope] = mapped_column(
        Enum(SharingScope, name="sharing_scope_enum"),
        nullable=False,
        default=SharingScope.private,
        server_default=SharingScope.private.value,
    )

    # -- Audit ----------------------------------------------------------------
    # FK comment only -- references User.id (the user who issued the grant).
    # Enforced once the User table lands on this branch.
    granted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
    )

    def __repr__(self) -> str:
        return (
            f"<Permission id={self.id} user_id={self.user_id} "
            f"resource_type={self.resource_type} resource_id={self.resource_id} "
            f"level={self.permission_level}>"
        )
