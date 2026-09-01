from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

# --- Folder Schemas ---
class FolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_folder_id: Optional[UUID] = None

class FolderCreate(FolderBase):
    workspace_id: UUID

class FolderUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)

class FolderMove(BaseModel):
    parent_folder_id: Optional[UUID] = None

class FolderResponse(FolderBase):
    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- File Schemas ---
class FileBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    file_type: str
    file_size: int

class FileCreate(FileBase):
    folder_id: Optional[UUID] = None
    workspace_id: Optional[UUID] = None

class FileUpdate(BaseModel):
    file_name: Optional[str] = Field(None, min_length=1, max_length=255)

class FileResponse(FileBase):
    id: UUID
    file_url: str
    uploader_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True