"""
Notification controller — sits between routes and the notification service.

Flow: route -> schema -> controller -> service -> model

Wraps every response in {success, message, data}.
Catches NotImplementedError from service stubs and returns 501 with a clear
message until User model is merged.
"""

import uuid
from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.notification_schema import (
    MarkReadRequest,
    NotificationListResponse,
    NotificationResponse,
)
from services import notification_service


def _envelope(success: bool, message: str, data: Any = None) -> Dict:
    return {"success": success, "message": message, "data": data}


def _not_implemented_envelope(fn_name: str) -> Dict:
    return _envelope(
        success=False,
        message=f"{fn_name} is not yet implemented — pending User model merge.",
        data=None,
    )


# ---------------------------------------------------------------------------
# GET /api/notifications
# ---------------------------------------------------------------------------

async def list_notifications(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """Return a paginated list of all notifications for the current user."""
    try:
        items = await notification_service.get_user_notifications(
            db=db,
            user_id=current_user_id,
            unread_only=False,
            limit=limit,
            offset=offset,
        )
        response = NotificationListResponse(
            total=len(items),   # TODO: replace with actual count query once implemented
            limit=limit,
            offset=offset,
            items=[NotificationResponse.model_validate(n) for n in items],
        )
        return _envelope(success=True, message="Notifications retrieved.", data=response)
    except NotImplementedError:
        return _not_implemented_envelope("get_user_notifications")


# ---------------------------------------------------------------------------
# GET /api/notifications/unread
# ---------------------------------------------------------------------------

async def list_unread_notifications(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """Return only unread notifications for the current user."""
    try:
        items = await notification_service.get_user_notifications(
            db=db,
            user_id=current_user_id,
            unread_only=True,
            limit=limit,
            offset=offset,
        )
        response = NotificationListResponse(
            total=len(items),
            limit=limit,
            offset=offset,
            items=[NotificationResponse.model_validate(n) for n in items],
        )
        return _envelope(success=True, message="Unread notifications retrieved.", data=response)
    except NotImplementedError:
        return _not_implemented_envelope("get_user_notifications")


# ---------------------------------------------------------------------------
# PUT /api/notifications/{notification_id}/read
# ---------------------------------------------------------------------------

async def mark_notification_read(
    db: AsyncSession,
    notification_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> Dict:
    """Mark a single notification as read."""
    try:
        updated = await notification_service.mark_as_read(
            db=db,
            notification_id=notification_id,
            user_id=current_user_id,
        )
        return _envelope(
            success=True,
            message="Notification marked as read.",
            data=NotificationResponse.model_validate(updated),
        )
    except NotImplementedError:
        return _not_implemented_envelope("mark_as_read")
    except LookupError:
        raise HTTPException(status_code=404, detail="Notification not found.")


# ---------------------------------------------------------------------------
# PUT /api/notifications/read_all
# ---------------------------------------------------------------------------

async def mark_all_notifications_read(
    db: AsyncSession,
    current_user_id: uuid.UUID,
) -> Dict:
    """Mark all unread notifications for the current user as read."""
    try:
        updated_count = await notification_service.mark_all_as_read(
            db=db,
            user_id=current_user_id,
        )
        return _envelope(
            success=True,
            message=f"{updated_count} notification(s) marked as read.",
            data={"updated_count": updated_count},
        )
    except NotImplementedError:
        return _not_implemented_envelope("mark_all_as_read")


# ---------------------------------------------------------------------------
# DELETE /api/notifications/{notification_id}
# ---------------------------------------------------------------------------

async def delete_notification(
    db: AsyncSession,
    notification_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> Dict:
    """Delete a single notification (hard delete, ownership-guarded)."""
    try:
        await notification_service.delete_notification(
            db=db,
            notification_id=notification_id,
            user_id=current_user_id,
        )
        return _envelope(success=True, message="Notification deleted.", data=None)
    except NotImplementedError:
        return _not_implemented_envelope("delete_notification")
    except LookupError:
        raise HTTPException(status_code=404, detail="Notification not found.")
