from typing import Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    status,
    HTTPException,
    Query,
)

from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from controllers.document_controller import DocumentController
from middleware.auth_middleware import get_current_user

from schemas.document_schema import (
    DocumentCreate,
    DocumentUpdate,
    DocumentAutosave,
    DocumentMove,
    DocumentFavorite,
)


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


# ---------------------------------------------------------
# Get all documents
# ---------------------------------------------------------

@router.get(
    "",
    status_code=status.HTTP_200_OK,
)
async def get_all_documents(
    workspace_id: Optional[UUID] = Query(
        None,
        description="Filter documents by workspace ID",
    ),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    if workspace_id:
        result = await DocumentController.get_documents_by_workspace(
            db,
            workspace_id,
            current_user.id,
        )
    else:
        result = await DocumentController.get_all_documents(
            db,
            current_user.id,
        )

    if not result.get("success", True):
        raise HTTPException(
            status_code=500,
            detail=result.get(
                "message",
                "Failed to fetch documents",
            ),
        )

    return result


# ---------------------------------------------------------
# Create document
# ---------------------------------------------------------

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    doc_data: DocumentCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await DocumentController.create_document(
        db,
        current_user.id,
        doc_data,
    )

    if not result.get("success", True):
        raise HTTPException(
            status_code=400,
            detail=result.get(
                "message",
                "Document creation failed",
            ),
        )

    return result


# ---------------------------------------------------------
# Get single document
# ---------------------------------------------------------

@router.get("/{document_id}")
async def get_document(
    document_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    result = await DocumentController.get_document(
        db,
        document_id,
        current_user.id,
    )

    if not result.get("success", True):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this document.",
        )

    return result


# ---------------------------------------------------------
# Update document
# ---------------------------------------------------------

@router.put("/{document_id}")
async def update_document(
    document_id: UUID,
    doc_data: DocumentUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    try:
        result = await DocumentController.update_document(
            db,
            document_id,
            current_user.id,
            doc_data,
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

    if not result.get("success", True):
        raise HTTPException(
            status_code=404,
            detail=result.get(
                "message",
                "Update failed",
            ),
        )

    return result


# ---------------------------------------------------------
# Autosave document
# ---------------------------------------------------------

@router.post("/{document_id}/autosave")
async def autosave_document(
    document_id: UUID,
    autosave_data: DocumentAutosave,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    try:
        result = await DocumentController.autosave_document(
            db,
            document_id,
            current_user.id,
            autosave_data,
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

    if not result.get("success", True):
        raise HTTPException(
            status_code=404,
            detail=result.get(
                "message",
                "Autosave failed",
            ),
        )

    return result


# ---------------------------------------------------------
# Move document
# ---------------------------------------------------------

@router.post("/{document_id}/move")
async def move_document(
    document_id: UUID,
    move_data: DocumentMove,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    try:
        result = await DocumentController.move_document(
            db,
            document_id,
            current_user.id,
            move_data,
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

    if not result.get("success", True):
        raise HTTPException(
            status_code=404,
            detail=result.get(
                "message",
                "Move failed",
            ),
        )

    return result


# ---------------------------------------------------------
# Toggle favorite
# ---------------------------------------------------------

@router.post("/{document_id}/favorite")
async def toggle_favorite(
    document_id: UUID,
    fav_data: DocumentFavorite,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    try:
        result = await DocumentController.toggle_favorite(
            db,
            document_id,
            current_user.id,
            fav_data,
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

    if not result.get("success", True):
        raise HTTPException(
            status_code=404,
            detail=result.get(
                "message",
                "Favorite toggle failed",
            ),
        )

    return result


# ---------------------------------------------------------
# Delete document
# ---------------------------------------------------------

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_document(
    document_id: UUID,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    try:
        result = await DocumentController.delete_document(
            db,
            document_id,
            current_user.id,
        )

    except PermissionError as e:
        raise HTTPException(
            status_code=403,
            detail=str(e),
        )

    if not result.get("success", True):
        raise HTTPException(
            status_code=404,
            detail=result.get(
                "message",
                "Delete failed",
            ),
        )

    return result