from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class DocumentBase(BaseModel):
    title: str = Field(..., max_length=255)
    content: Optional[str] = None
    folder_id: Optional[UUID] = None

class DocumentCreate(DocumentBase):
    workspace_id: Optional[UUID] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    folder_id: Optional[UUID] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None

class DocumentAutosave(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    
class DocumentMove(BaseModel):
    folder_id: Optional[UUID] = None

class DocumentFavorite(BaseModel):
    is_favorite: bool

class DocumentResponse(DocumentBase):
    id: UUID
    workspace_id: UUID
    owner_id: UUID
    is_favorite: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True