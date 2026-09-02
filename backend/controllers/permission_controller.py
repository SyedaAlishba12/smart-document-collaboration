"""
Permission controller — sits between routes and the permission service.

Flow: route -> schema -> controller -> service -> model

Each function wraps the service call in the standard API envelope:
  {success: bool, message: str, data: any}
"""

import uuid
from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from models.permission import PermissionLevel, SharingScope
from schemas.permission_schema import (
    LinkSharingRequest,
    PermissionResponse,
    ShareDocumentRequest,
    UpdatePermissionRequest,
)
from services import permission_service


def _envelope(success: bool, message: str, data: Any = None) -> Dict:
    return {"success": success, "message": message, "data": data}


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
        scope = SharingScope(body.sharing_scope) if body.sharing_scope else SharingScope.private
        permission = await permission_service.grant_permission(
            db=db,
            resource_type="document",
            resource_id=document_id,
            user_id=body.user_id,
            level=PermissionLevel(body.permission_level),
            granted_by=current_user_id,
            sharing_scope=scope,
        )
        return _envelope(
            success=True,
            message="Permission granted successfully.",
            data=PermissionResponse.model_validate(permission).model_dump(mode="json"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


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

    Returns a PermissionListResponse with user name and email resolved
    via a JOIN so the frontend share dialog can render without extra calls.
    """
    result = await permission_service.list_permissions(
        db=db,
        document_id=document_id,
    )
    return _envelope(
        success=True,
        message="Permissions retrieved.",
        data=result.model_dump(mode="json"),
    )


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

    At least one of permission_level or sharing_scope must be provided.
    """
    if body.permission_level is None and body.sharing_scope is None:
        raise HTTPException(
            status_code=400,
            detail="At least one of permission_level or sharing_scope must be provided.",
        )

    try:
        level = PermissionLevel(body.permission_level) if body.permission_level else None
        scope = SharingScope(body.sharing_scope) if body.sharing_scope else None

        updated = await permission_service.update_permission(
            db=db,
            permission_id=permission_id,
            level=level,
            scope=scope,
            updated_by=current_user_id,
        )
        return _envelope(
            success=True,
            message="Permission updated.",
            data=PermissionResponse.model_validate(updated).model_dump(mode="json"),
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ---------------------------------------------------------------------------
# DELETE /api/documents/{document_id}/permissions/{permission_id}
# ---------------------------------------------------------------------------

async def revoke_document_permission(
    db: AsyncSession,
    document_id: uuid.UUID,
    permission_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> Dict:
    """Revoke a specific permission grant on a document."""
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
    Enable or disable link-based sharing for a document and set the
    link-level permission.
    """
    link_level: Optional[PermissionLevel] = None
    if body.link_permission_level:
        link_level = PermissionLevel(body.link_permission_level)

    result = await permission_service.configure_link_sharing(
        db=db,
        document_id=document_id,
        enabled=body.enabled,
        link_permission_level=link_level,
        current_user_id=current_user_id,
    )
    return _envelope(
        success=True,
        message="Link sharing configured.",
        data=result.model_dump(mode="json"),
    )
