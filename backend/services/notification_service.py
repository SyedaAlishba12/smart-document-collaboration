"""
Notification service — real async SQLAlchemy 2.0 implementations.

All functions are async-only (team rule: no sync SQLAlchemy anywhere).

Design notes
------------
- get_user_notifications() is paginated via limit/offset to keep response
  payloads bounded.  Cursor-based pagination may be adopted later if the
  notifications table grows large (flag for tech-debt review).
- mark_all_as_read() issues a single bulk UPDATE for efficiency; it does NOT
  load each row into memory before updating.
- delete_notification() is a hard delete by design (no soft-delete needed for
  notifications -- they are ephemeral by nature).  Confirm with product if an
  audit trail of dismissed notifications is ever required.
"""

import uuid
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.notification import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    notification_type: NotificationType,
    resource_type: str,
    resource_id: uuid.UUID,
    message: str,
) -> Notification:
    """
    Persist a new notification for a user and return the created row.

    Called internally by other services (e.g. comment_service, permission_service)
    when an event occurs that the user should be informed about.  Not intended
    to be called directly from a route handler.

    Args:
        db:                Async DB session.
        user_id:           UUID of the recipient user.
        notification_type: The kind of event (mention, share, comment, ...).
        resource_type:     String label of the resource ("document", "comment", etc.).
        resource_id:       UUID of the relevant resource row.
        message:           Human-readable notification body (pre-rendered by caller).

    Returns:
        The newly created Notification ORM instance.
    """
    notif = Notification(
        user_id=user_id,
        type=notification_type,
        resource_type=resource_type,
        resource_id=resource_id,
        message=message,
        is_read=False,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def get_user_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    unread_only: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> list[Notification]:
    """
    Return a paginated list of notifications for a user, newest first.

    Args:
        db:          Async DB session.
        user_id:     UUID of the user whose notifications to fetch.
        unread_only: If True, filter to is_read == False only.
        limit:       Maximum number of rows to return (default 20, max TBD).
        offset:      Row offset for pagination.

    Returns:
        List of Notification instances ordered by created_at DESC.
    """
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def mark_as_read(
    db: AsyncSession,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Notification:
    """
    Set is_read = True on a single notification and return the updated row.

    user_id is required to ensure a user cannot mark another user's
    notification as read (ownership check).

    Args:
        db:              Async DB session.
        notification_id: UUID of the Notification row to update.
        user_id:         UUID of the requesting user (ownership guard).

    Returns:
        The updated Notification instance.

    Raises:
        LookupError: if no matching notification exists for (notification_id, user_id).
    """
    result = await db.execute(
        select(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise LookupError(
            f"Notification {notification_id!r} not found for user {user_id!r}."
        )
    row.is_read = True
    await db.flush()
    await db.refresh(row)
    return row


async def mark_all_as_read(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> int:
    """
    Bulk-set is_read = True for all unread notifications belonging to user_id.

    Uses a single UPDATE statement (no row-by-row iteration) for efficiency.

    Args:
        db:      Async DB session.
        user_id: UUID of the user whose notifications to update.

    Returns:
        The number of rows updated (useful for confirming the operation in
        the API response envelope).
    """
    result = await db.execute(
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
        .execution_options(synchronize_session=False)
    )
    await db.flush()
    return result.rowcount


async def delete_notification(
    db: AsyncSession,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    """
    Hard-delete a single notification row.

    user_id is required as an ownership guard so a user cannot delete
    another user's notification.

    Args:
        db:              Async DB session.
        notification_id: UUID of the Notification row to delete.
        user_id:         UUID of the requesting user (ownership guard).

    Raises:
        LookupError: if no matching notification exists for (notification_id, user_id).
    """
    result = await db.execute(
        select(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise LookupError(
            f"Notification {notification_id!r} not found for user {user_id!r}."
        )
    await db.delete(row)
    await db.flush()
