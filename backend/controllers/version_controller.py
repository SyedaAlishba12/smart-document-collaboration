from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from models.document import Document

from schemas.document_version import DocumentVersionCreate
from services.document_version_service import DocumentVersionService


async def create_version(
    session: AsyncSession,
    document_id: UUID,
    user_id: UUID,
    data: DocumentVersionCreate,
):
    return await DocumentVersionService.create_version(
        session, document_id, user_id, data.content
    )


async def get_versions(
    session: AsyncSession,
    document_id: UUID,
):
    return await DocumentVersionService.get_document_versions(
        session, document_id
    )


async def get_version(
    session: AsyncSession,
    document_id: UUID,
    version_id: UUID,
):
    version = await DocumentVersionService.get_version(session, version_id)
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found",
        )
    return version


async def restore_version(
    session: AsyncSession,
    document_id: UUID,
    version_id: UUID,
):
    version = await DocumentVersionService.get_version(session, version_id)
    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found",
        )

    # Update the actual Document content (Zainab's model)
    document = await session.get(Document, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    document.content = version.content
    await session.commit()
    await session.refresh(document)

    # Create a new version to record this restore action
    new_version = await DocumentVersionService.create_version(
        session, document_id, version.created_by, document.content
    )

    return new_version