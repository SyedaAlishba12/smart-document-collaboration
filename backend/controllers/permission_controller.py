"""
Permission controller — sits between routes and the permission service.

Flow: route -> schema -> controller -> service -> model

Each function wraps the service call in the standard API envelope:
  {success: bool, message: str, data: any}

Service functions currently raise NotImplementedError because User/Document/
Folder models are not yet on this branch.  The controller catches
NotImplementedError and returns a 501 response with a clear message so the
rest of the app does not crash during development.
"""

import uuid
from typing import Any, Dict

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.permission_schema import (
    LinkSharingRequest,
    LinkSharingResponse,
    PermissionResponse,
    ShareDocumentRequest,
    UpdatePermissionRequest,
)
from services import permission_service


def _envelope(success: bool, message: str, data: Any = None) -> Dict:
    return {"success": success, "message": message, "data": data}


def _not_implemented_envelope(fn_name: str) -> Dict:
    """Standard stub response until service logic is implemented."""
    return _envelope(
        success=False,
        message=f"{fn_name} is not yet implemented — pending User/Document model merge.",
        data=None,
    )


# ---------------------------------------------------------------------------
# POST /api/documents/{document_id}/share
# ---------------------------------------------------------------------------

async def share_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    body: ShareDocumentRequest,
    current_user_id: uuid.UUID,
) -> Dict:
    """
    Grant a user access to a document.

    granted_by is derived from the authenticated session (current_user_id),
    not from the request body.
    """
    try:
        permission = await permission_service.grant_permission(
            db=db,
            resource_type="document",
            resource_id=document_id,
            user_id=body.user_id,
            level=body.permission_level,
            granted_by=current_user_id,
        )
        return _envelope(
            success=True,
            message="Permission granted successfully.",
            data=PermissionResponse.model_validate(permission),
        )
    except NotImplementedError:
        return _not_implemented_envelope("grant_permission")


# ---------------------------------------------------------------------------
# GET /api/documents/{document_id}/permissions
# ---------------------------------------------------------------------------

async def get_document_permissions(
    db: AsyncSession,
    document_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> Dict:
    """
    List all permission grants on a document.

    TODO: call a list_permissions(db, resource_type, resource_id) service
    function once it is added to permission_service.py (the initial scaffold
    only includes grant/revoke; listing is a natural addition).
    """
    # Stub — service function for listing doesn't exist yet.
    return _not_implemented_envelope("list_permissions")


# ---------------------------------------------------------------------------
# PUT /api/documents/{document_id}/permissions/{permission_id}
# ---------------------------------------------------------------------------

async def update_permission(
    db: AsyncSession,
    document_id: uuid.UUID,
    permission_id: uuid.UUID,
    body: UpdatePermissionRequest,
    current_user_id: uuid.UUID,
) -> Dict:
    """
    Update the level or scope of an existing permission grant.

    TODO: add update_permission() to permission_service once a pattern for
    partial updates is confirmed with the team.
    """
    return _not_implemented_envelope("update_permission")


# ---------------------------------------------------------------------------
# DELETE /api/documents/{document_id}/permissions/{permission_id}
# ---------------------------------------------------------------------------

async def revoke_document_permission(
    db: AsyncSession,
    document_id: uuid.UUID,
    permission_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> Dict:
    """
    Revoke a specific permission grant on a document.
    """
    try:
        await permission_service.revoke_permission(
            db=db,
            permission_id=permission_id,
        )
        return _envelope(
            success=True,
            message="Permission revoked.",
            data=None,
        )
    except NotImplementedError:
        return _not_implemented_envelope("revoke_permission")
    except LookupError:
        raise HTTPException(status_code=404, detail="Permission not found.")


# ---------------------------------------------------------------------------
# POST /api/documents/{document_id}/link_sharing
# ---------------------------------------------------------------------------

async def configure_link_sharing(
    db: AsyncSession,
    document_id: uuid.UUID,
    body: LinkSharingRequest,
    current_user_id: uuid.UUID,
) -> Dict:
    """
    Enable or disable link-based sharing for a document and set the link-level
    permission.

    TODO: implement once sharing_scope handling is finalised in permission_service.
    The shareable_link URL generation strategy (signed URL vs. opaque token)
    is an open design question — flag for team review.
    """
    return _not_implemented_envelope("configure_link_sharing")
