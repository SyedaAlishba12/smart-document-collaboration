"""
Pydantic schemas for the Notifications API.

These validate request bodies and shape response payloads only.

Naming follows team rules:
  - PascalCase for schema classes
  - snake_case for all field names
"""

import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


NotificationTypeLiteral = Literal[
    "mention",
    "share",
    "comment",
    "reply",
    "permission_change",
    "document_update",
]


# ---------------------------------------------------------------------------
# Single notification response
# ---------------------------------------------------------------------------


class NotificationResponse(BaseModel):
    """Shape of a single notification returned to the client."""

    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationTypeLiteral
    resource_type: str
    resource_id: uuid.UUID
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------


class NotificationListResponse(BaseModel):
    """
    Paginated list of notifications.

    total:    total matching rows in the DB (for building pagination UI).
    limit:    page size that was applied.
    offset:   offset that was applied.
    items:    the current page of notifications.
    """

    total: int
    limit: int
    offset: int
    items: List[NotificationResponse]


# ---------------------------------------------------------------------------
# Mark specific notifications as read (used with PUT /api/notifications/{id}/read)
# No request body needed for that endpoint — id comes from the path.
# MarkReadRequest is available if a bulk-by-id endpoint is added later.
# ---------------------------------------------------------------------------


class MarkReadRequest(BaseModel):
    """
    Optional request body for marking specific notification IDs as read in bulk.
    Not used by the current single-resource endpoint but scaffolded for future
    use (e.g. POST /api/notifications/read_bulk).
    """

    notification_ids: List[uuid.UUID]
