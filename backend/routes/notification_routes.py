"""
Notification routes — REST endpoints for in-app notifications.

Paths:
  GET    /api/notifications
  GET    /api/notifications/unread
  PUT    /api/notifications/{notification_id}/read
  PUT    /api/notifications/read_all
  DELETE /api/notifications/{notification_id}

All routes:
  - Require an authenticated user (get_current_user_id dependency).
  - Delegate to notification_controller for business logic.
  - Return {success, message, data} from the controller as-is.

ORDERING NOTE: /api/notifications/read_all must be declared BEFORE
/{notification_id}/read in the router so FastAPI does not try to parse
"read_all" as a UUID.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from controllers import notification_controller
from middleware.permission_middleware import get_current_user_id, get_db

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ---------------------------------------------------------------------------
# GET /api/notifications
# ---------------------------------------------------------------------------

@router.get(
    "",
    summary="List all notifications for the current user (paginated)",
)
async def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await notification_controller.list_notifications(
        db=db,
        current_user_id=current_user_id,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# GET /api/notifications/unread
# ---------------------------------------------------------------------------

@router.get(
    "/unread",
    summary="List only unread notifications for the current user",
)
async def list_unread_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await notification_controller.list_unread_notifications(
        db=db,
        current_user_id=current_user_id,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# PUT /api/notifications/read_all  — MUST be above /{notification_id}/read
# ---------------------------------------------------------------------------

@router.put(
    "/read_all",
    summary="Mark all notifications as read for the current user",
)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await notification_controller.mark_all_notifications_read(
        db=db,
        current_user_id=current_user_id,
    )


# ---------------------------------------------------------------------------
# PUT /api/notifications/{notification_id}/read
# ---------------------------------------------------------------------------

@router.put(
    "/{notification_id}/read",
    summary="Mark a single notification as read",
)
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await notification_controller.mark_notification_read(
        db=db,
        notification_id=notification_id,
        current_user_id=current_user_id,
    )


# ---------------------------------------------------------------------------
# DELETE /api/notifications/{notification_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{notification_id}",
    summary="Delete a notification",
)
async def delete_notification(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await notification_controller.delete_notification(
        db=db,
        notification_id=notification_id,
        current_user_id=current_user_id,
    )
