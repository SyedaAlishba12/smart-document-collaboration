from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from database.session import AsyncSessionLocal
from schemas.document_version import DocumentVersionResponse
from services.document_version_service import DocumentVersionService


router = APIRouter(
    prefix="/api",
    tags=["Document Versions"],
)


class DocumentVersionCreate(BaseModel):
    content: str = Field(min_length=1)


@router.post(
    "/documents/{document_id}/versions",
    response_model=DocumentVersionResponse,
    status_code=201,
)
async def create_version(
    document_id: UUID,
    data: DocumentVersionCreate,
    created_by: UUID = Query(...),
):
    async with AsyncSessionLocal() as session:
        return await DocumentVersionService.create_version(
            session=session,
            document_id=document_id,
            created_by=created_by,
            content=data.content,
        )


@router.get(
    "/documents/{document_id}/versions",
    response_model=list[DocumentVersionResponse],
)
async def get_document_versions(
    document_id: UUID,
):
    async with AsyncSessionLocal() as session:
        return await DocumentVersionService.get_document_versions(
            session=session,
            document_id=document_id,
        )


@router.get(
    "/documents/{document_id}/versions/latest",
    response_model=DocumentVersionResponse,
)
async def get_latest_version(
    document_id: UUID,
):
    async with AsyncSessionLocal() as session:
        version = await DocumentVersionService.get_latest_version(
            session=session,
            document_id=document_id,
        )

        if version is None:
            raise HTTPException(
                status_code=404,
                detail="No version found for this document",
            )

        return version


@router.get(
    "/versions/{version_id}",
    response_model=DocumentVersionResponse,
)
async def get_version(
    version_id: UUID,
):
    async with AsyncSessionLocal() as session:
        version = await DocumentVersionService.get_version(
            session=session,
            version_id=version_id,
        )

        if version is None:
            raise HTTPException(
                status_code=404,
                detail="Document version not found",
            )

        return version