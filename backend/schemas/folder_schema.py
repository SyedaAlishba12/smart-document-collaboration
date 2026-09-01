from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    workspace_id: UUID
    parent_folder_id: Optional[UUID] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_folder_id: Optional[UUID] = None

class FolderMove(BaseModel):
    parent_folder_id: Optional[UUID] = None

class FolderResponse(FolderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True