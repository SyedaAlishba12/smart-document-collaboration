from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from common.auth_dependency import get_current_user_id
from controllers.version_controller import (
    create_version,
    get_version,
    get_versions,
    restore_version,
)
from database.session import get_db
from schemas.document_version import (
    DocumentVersionCreate,
    DocumentVersionResponse,
)

router = APIRouter(prefix="/api", tags=["Versions"])


@router.get(
    "/documents/{document_id}/versions",
    response_model=list[DocumentVersionResponse],
)
async def list_versions(
    document_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    return await get_versions(session, document_id)


@router.get(
    "/documents/{document_id}/versions/{version_id}",
    response_model=DocumentVersionResponse,
)
async def version_detail(
    document_id: UUID,
    version_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    return await get_version(session, document_id, version_id)


@router.post(
    "/documents/{document_id}/versions",
    response_model=DocumentVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    document_id: UUID,
    data: DocumentVersionCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await create_version(session, document_id, user_id, data)


@router.post(
    "/documents/{document_id}/versions/{version_id}/restore",
    response_model=DocumentVersionResponse,
)
async def restore(
    document_id: UUID,
    version_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await restore_version(session, document_id, version_id)