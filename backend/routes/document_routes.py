from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from database.session import get_db
from controllers.document_controller import DocumentController
from schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentAutosave, DocumentMove, DocumentFavorite

# Import version service for handling document version history
from services.document_version_service import DocumentVersionService

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.get("", status_code=status.HTTP_200_OK)
async def get_all_documents(
    workspace_id: Optional[UUID] = Query(None, description="Filter documents by workspace ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve documents filtered by workspace ID if provided, otherwise fetch all.
    """
    if workspace_id and hasattr(DocumentController, 'get_documents_by_workspace'):
        return await DocumentController.get_documents_by_workspace(db, workspace_id)
    
    result = await DocumentController.get_all_documents(db) if hasattr(DocumentController, 'get_all_documents') else {"success": True, "data": []}
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_document(
    doc_data: DocumentCreate,
    owner_id: Optional[UUID] = Query(None, description="Owner ID from auth"),
    workspace_id: Optional[UUID] = Query(None, description="Workspace ID from query parameters"),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new document, assigning proper owner and workspace identifiers.
    """
    if not owner_id:
        owner_id = UUID("00000000-0000-0000-0000-000000000000")
    
    # Prioritize workspace_id from query parameter if available, else payload, else fallback
    if workspace_id:
        doc_data.workspace_id = workspace_id
    elif not doc_data.workspace_id:
        doc_data.workspace_id = UUID("11111111-1111-1111-1111-111111111111")
        
    result = await DocumentController.create_document(db, owner_id, doc_data)
    if not result.get("success", True):
        raise HTTPException(status_code=400, detail=result.get("message", "Document creation failed"))
    return result


@router.get("/{document_id}")
async def get_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Fetch a single document by its unique UUID.
    """
    result = await DocumentController.get_document(db, document_id)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Document not found"))
    return result


@router.put("/{document_id}")
async def update_document(document_id: UUID, doc_data: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update document properties completely.
    """
    result = await DocumentController.update_document(db, document_id, doc_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Update failed"))
    return result


@router.post("/{document_id}/autosave")
async def autosave_document(
    document_id: UUID,
    autosave_data: DocumentAutosave,
    db: AsyncSession = Depends(get_db),
):
    """
    Save document content automatically and trigger a version history snapshot.
    """
    result = await DocumentController.autosave_document(db, document_id, autosave_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Autosave failed"))

    # After successful autosave, create a new version handling dictionary safely
    doc = result.get("data")
    if doc:
        # Check if returned doc data is a dictionary or an ORM object
        if isinstance(doc, dict):
            owner_id = doc.get("owner_id")
            content = doc.get("content")
        else:
            owner_id = getattr(doc, "owner_id", None)
            content = getattr(doc, "content", None)

        if owner_id and content is not None:
            await DocumentVersionService.create_version(
                session=db,
                document_id=document_id,
                created_by=owner_id,
                content=content,
            )
    return result


@router.post("/{document_id}/move")
async def move_document(document_id: UUID, move_data: DocumentMove, db: AsyncSession = Depends(get_db)):
    """
    Move document to a specific folder or location.
    """
    result = await DocumentController.move_document(db, document_id, move_data)
    if not result.get("success",True):
        raise HTTPException(status_code=404, detail=result.get("message", "Move failed"))
    return result


@router.post("/{document_id}/favorite")
async def toggle_favorite(document_id: UUID, fav_data: DocumentFavorite, db: AsyncSession = Depends(get_db)):
    """
    Toggle favorite status for quick document filtering.
    """
    result = await DocumentController.toggle_favorite(db, document_id, fav_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Favorite toggle failed"))
    return result


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Permanently delete a document by ID.
    """
    result = await DocumentController.delete_document(db, document_id)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Delete failed"))
    return result