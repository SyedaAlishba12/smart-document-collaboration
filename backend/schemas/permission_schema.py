"""
Pydantic schemas for the Permissions & Sharing API.

These validate request bodies and shape response payloads only.
No DB logic lives here.

Naming follows team rules:
  - PascalCase for schema classes
  - snake_case for all field names
  - Every response is eventually wrapped in {success, message, data} by the
    controller; the schemas here represent only the *data* portion.
"""

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (mirrored from models/permission.py as string literals for Pydantic)
# Using Literal instead of re-importing SQLAlchemy enums keeps schemas
# decoupled from the ORM layer.
# ---------------------------------------------------------------------------

PermissionLevelLiteral = Literal["owner", "editor", "commenter", "viewer"]
SharingScopeLiteral = Literal["private", "workspace", "anyone_with_link"]
ResourceTypeLiteral = Literal["document", "folder"]


# ---------------------------------------------------------------------------
# Permission responses
# ---------------------------------------------------------------------------


class PermissionResponse(BaseModel):
    """Shape of a single permission grant returned to the client."""

    id: uuid.UUID
    resource_type: ResourceTypeLiteral
    resource_id: uuid.UUID
    user_id: uuid.UUID
    permission_level: PermissionLevelLiteral
    sharing_scope: SharingScopeLiteral
    granted_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Share a document/folder with a user (POST /api/documents/{id}/share)
# ---------------------------------------------------------------------------


class ShareDocumentRequest(BaseModel):
    """
    Request body for granting a user access to a document.

    user_id identifies the recipient.  The grantor is derived from the
    authenticated session in the route handler, not sent in the body.
    """

    user_id: uuid.UUID = Field(..., description="UUID of the user to share with.")
    permission_level: PermissionLevelLiteral = Field(
        ...,
        description="Access level to grant: owner | editor | commenter | viewer.",
    )
    sharing_scope: SharingScopeLiteral = Field(
        "private",
        description="Scope of the sharing grant.",
    )
    message: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional personal message sent alongside the share invite.",
    )


# ---------------------------------------------------------------------------
# Update an existing permission (PUT /api/documents/{id}/permissions/{perm_id})
# ---------------------------------------------------------------------------


class UpdatePermissionRequest(BaseModel):
    """
    Request body to change the level or scope of an existing permission grant.
    At least one field must be provided; validation is enforced in the controller.
    """

    permission_level: Optional[PermissionLevelLiteral] = None
    sharing_scope: Optional[SharingScopeLiteral] = None


# ---------------------------------------------------------------------------
# Link-sharing (POST /api/documents/{id}/link_sharing)
# ---------------------------------------------------------------------------


class LinkSharingRequest(BaseModel):
    """
    Enable or configure link-based sharing for a document.

    link_permission_level: what anyone with the link can do.
    enabled: False to disable link sharing entirely.
    """

    enabled: bool = Field(..., description="Whether link sharing is active.")
    link_permission_level: Optional[PermissionLevelLiteral] = Field(
        "viewer",
        description="Access level granted to anyone with the link.",
    )


class LinkSharingResponse(BaseModel):
    """
    Returned after link-sharing settings are updated.

    shareable_link will be None when enabled=False.
    """

    enabled: bool
    link_permission_level: Optional[PermissionLevelLiteral]
    shareable_link: Optional[str] = None
