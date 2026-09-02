"""
Permission model — owns access-control records for documents.

FK CONSTRAINTS:
    - document_id  -> Document.id ("documents" table, confirmed from
                      Zainab's feature/documents-editor-files branch,
                      __tablename__ = "documents")
    - user_id      -> User.id ("user" table, confirmed from Fatima's branch,
                      __tablename__ = "user")
    - granted_by   -> User.id (same table — the granting user)
                      NOTE: no relationship() added for user_id / granted_by yet;
                      Fatima's User model has no back_populates expecting a
                      Permission relationship.  Add once needed for traversal.

SCOPE DECISION (2026-08-27):
    Permissions are document-only.  Confirmed via Zainab's folder.py:
    Folder has no permissions relationship.  ResourceType enum and
    resource_type/resource_id columns have been removed and replaced with
    the concrete document_id FK column.

OPEN QUESTION:
    sharing_scope and granted_by columns are kept as-is — Syeda's reply
    on whether link-sharing scope lives here or on a separate link-sharing
    record is still pending.  Neither column is depended on by other models,
    so no urgency to change either way.
"""

import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base

if TYPE_CHECKING:
    from models.document import Document


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
    Stores a single access-control grant for a user on a document.

    One row = one (user_id, document_id, permission_level) tuple.
    Multiple rows for the same document represent different users with
    different levels.
    """

    __tablename__ = "permissions"

    # -- Primary key -----------------------------------------------------------
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )

    # -- Document being protected ----------------------------------------------
    # FK -> documents.id  (Zainab's table, confirmed 2026-08-27)
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id"),
        nullable=False,
        index=True,
    )

    # -- Who holds this permission ---------------------------------------------
    # FK -> user.id  (Fatima's table, singular __tablename__, confirmed)
    # No relationship() added yet — User has no back_populates for permissions.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
        index=True,
    )

    # -- What they can do -----------------------------------------------------
    permission_level: Mapped[PermissionLevel] = mapped_column(
        Enum(PermissionLevel, name="permission_level_enum"),
        nullable=False,
    )

    # -- How broadly the resource is shared -----------------------------------
    # OPEN: whether link-sharing scope stays here or moves to a dedicated
    # link-sharing record is pending Syeda's input.  No other model depends
    # on this column yet.
    sharing_scope: Mapped[SharingScope] = mapped_column(
        Enum(SharingScope, name="sharing_scope_enum"),
        nullable=False,
        default=SharingScope.private,
        server_default=SharingScope.private.value,
    )

    # -- Audit ----------------------------------------------------------------
    # FK -> user.id  (the user who issued the grant)
    # No relationship() — same reasoning as user_id above.
    granted_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user.id"),
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

    # -- Relationships --------------------------------------------------------
    # Completes the back_populates declared on Document.permissions.
    # Document.permissions = relationship("Permission", back_populates="document",
    #                                     cascade="all, delete-orphan")
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="permissions",
    )

    def __repr__(self) -> str:
        return (
            f"<Permission id={self.id} user_id={self.user_id} "
            f"document_id={self.document_id} level={self.permission_level}>"
        )
