from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from database.session import get_db
from controllers.document_controller import DocumentController
from schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentAutosave, DocumentMove, DocumentFavorite

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.get("", status_code=status.HTTP_200_OK)
async def get_all_documents(db: AsyncSession = Depends(get_db)):
    """Fetch all documents"""
    result = await DocumentController.get_all_documents(db) if hasattr(DocumentController, 'get_all_documents') else {"success": True, "data": []}
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_document(
    doc_data: DocumentCreate, 
    owner_id: Optional[UUID] = Query(None, description="Owner ID from auth"), 
    db: AsyncSession = Depends(get_db)
):
    if not owner_id:
        owner_id = UUID("00000000-0000-0000-0000-000000000000")
        
    if not doc_data.workspace_id:
        doc_data.workspace_id = UUID("11111111-1111-1111-1111-111111111111")
        
    result = await DocumentController.create_document(db, owner_id, doc_data)
    if not result.get("success", True):
        raise HTTPException(status_code=400, detail=result.get("message", "Document creation failed"))
    return result

@router.get("/{document_id}")
async def get_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await DocumentController.get_document(db, document_id)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Document not found"))
    return result

@router.put("/{document_id}")
async def update_document(document_id: UUID, doc_data: DocumentUpdate, db: AsyncSession = Depends(get_db)):
    result = await DocumentController.update_document(db, document_id, doc_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Update failed"))
    return result

@router.post("/{document_id}/autosave")
async def autosave_document(document_id: UUID, autosave_data: DocumentAutosave, db: AsyncSession = Depends(get_db)):
    result = await DocumentController.autosave_document(db, document_id, autosave_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Autosave failed"))
    return result

@router.post("/{document_id}/move")
async def move_document(document_id: UUID, move_data: DocumentMove, db: AsyncSession = Depends(get_db)):
    result = await DocumentController.move_document(db, document_id, move_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Move failed"))
    return result

@router.post("/{document_id}/favorite")
async def toggle_favorite(document_id: UUID, fav_data: DocumentFavorite, db: AsyncSession = Depends(get_db)):
    result = await DocumentController.toggle_favorite(db, document_id, fav_data)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Favorite toggle failed"))
    return result

@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(document_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await DocumentController.delete_document(db, document_id)
    if not result.get("success", True):
        raise HTTPException(status_code=404, detail=result.get("message", "Delete failed"))
    return result