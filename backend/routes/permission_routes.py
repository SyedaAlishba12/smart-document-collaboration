"""
Permission routes — REST endpoints for sharing and access control.

Paths:
  POST   /api/documents/{document_id}/share
  GET    /api/documents/{document_id}/permissions
  PUT    /api/documents/{document_id}/permissions/{permission_id}
  DELETE /api/documents/{document_id}/permissions/{permission_id}
  POST   /api/documents/{document_id}/link_sharing

All routes:
  - Are guarded by require_can_share() (sharing actions require share rights).
  - Delegate to permission_controller for business logic.
  - Return {success, message, data} from the controller as-is.

NOTE: GET /permissions uses require_can_view instead of require_can_share,
because any user who can view the document should be able to see who else
has access (product assumption — confirm if this should be owner-only).
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from controllers import permission_controller
from middleware.permission_middleware import (
    get_current_user_id,
    get_db,
    require_can_share,
    require_can_view,
)
from schemas.permission_schema import (
    LinkSharingRequest,
    ShareDocumentRequest,
    UpdatePermissionRequest,
)

router = APIRouter(prefix="/api/documents", tags=["permissions"])


# ---------------------------------------------------------------------------
# POST /api/documents/{document_id}/share
# ---------------------------------------------------------------------------

@router.post(
    "/{document_id}/share",
    summary="Share a document with a user",
    dependencies=[Depends(require_can_share("document"))],
)
async def share_document(
    document_id: uuid.UUID,
    body: ShareDocumentRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await permission_controller.share_document(
        db=db,
        document_id=document_id,
        body=body,
        current_user_id=current_user_id,
    )


# ---------------------------------------------------------------------------
# GET /api/documents/{document_id}/permissions
# ---------------------------------------------------------------------------

@router.get(
    "/{document_id}/permissions",
    summary="List all permission grants on a document",
    dependencies=[Depends(require_can_view("document"))],
)
async def get_document_permissions(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await permission_controller.get_document_permissions(
        db=db,
        document_id=document_id,
        current_user_id=current_user_id,
    )


# ---------------------------------------------------------------------------
# PUT /api/documents/{document_id}/permissions/{permission_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{document_id}/permissions/{permission_id}",
    summary="Update an existing permission grant",
    dependencies=[Depends(require_can_share("document"))],
)
async def update_permission(
    document_id: uuid.UUID,
    permission_id: uuid.UUID,
    body: UpdatePermissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await permission_controller.update_permission(
        db=db,
        document_id=document_id,
        permission_id=permission_id,
        body=body,
        current_user_id=current_user_id,
    )


# ---------------------------------------------------------------------------
# DELETE /api/documents/{document_id}/permissions/{permission_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{document_id}/permissions/{permission_id}",
    summary="Revoke a permission grant",
    dependencies=[Depends(require_can_share("document"))],
)
async def revoke_permission(
    document_id: uuid.UUID,
    permission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await permission_controller.revoke_document_permission(
        db=db,
        document_id=document_id,
        permission_id=permission_id,
        current_user_id=current_user_id,
    )


# ---------------------------------------------------------------------------
# POST /api/documents/{document_id}/link_sharing
# ---------------------------------------------------------------------------

@router.post(
    "/{document_id}/link_sharing",
    summary="Configure link-based sharing for a document",
    dependencies=[Depends(require_can_share("document"))],
)
async def configure_link_sharing(
    document_id: uuid.UUID,
    body: LinkSharingRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await permission_controller.configure_link_sharing(
        db=db,
        document_id=document_id,
        body=body,
        current_user_id=current_user_id,
    )
