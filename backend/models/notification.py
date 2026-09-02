"""
Notification model -- stores in-app notifications delivered to users.

FK CONSTRAINTS NOT ENFORCED YET:
    - user_id      -> User.id
                     Table lives on a teammate's branch; FK DDL added once the
                     shared skeleton is merged.
    - resource_id  -> Document.id / Comment.id / etc. (varies by type)
                     Same reason -- these tables are on other branches.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class NotificationType(str, enum.Enum):
    mention = "mention"
    share = "share"
    comment = "comment"
    reply = "reply"
    permission_change = "permission_change"
    document_update = "document_update"


class Notification(Base):
    """
    A single in-app notification record for one recipient user.

    is_read defaults to False; the notification service flips it when the user
    views or explicitly dismisses the notification.
    """

    __tablename__ = "notifications"

    # -- Primary key -----------------------------------------------------------
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
        default=uuid.uuid4,
    )

    # -- Recipient -------------------------------------------------------------
    # FK comment only -- references User.id.
    # Enforced once the User table lands on this branch.
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # -- Notification kind -----------------------------------------------------
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type_enum"),
        nullable=False,
        index=True,
    )

    # -- What the notification is about ----------------------------------------
    # resource_type is a free string here (e.g. "document", "comment", "folder")
    # rather than a FK-backed enum, because the set of notifiable resource types
    # may expand without a schema migration.
    resource_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    # FK comment only -- references the relevant resource row (Document, Comment,
    # Folder, etc.).  Not enforceable until those tables are merged.
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # -- Human-readable content ------------------------------------------------
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # -- Read state ------------------------------------------------------------
    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
        index=True,
    )

    # -- Timestamps ------------------------------------------------------------
    # Notifications are immutable after creation -- no updated_at needed.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=text("now()"),
        index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<Notification id={self.id} user_id={self.user_id} "
            f"type={self.type} is_read={self.is_read}>"
        )
