import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DashboardStats(BaseModel):
    my_documents: int
    shared_with_me: int
    folders: int
    workspaces: int


class DashboardDocument(BaseModel):
    id: uuid.UUID
    title: str
    workspace_id: uuid.UUID
    owner_id: uuid.UUID
    folder_id: Optional[uuid.UUID] = None
    is_favorite: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardActivity(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    workspace_id: uuid.UUID
    document_id: Optional[uuid.UUID] = None
    action: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardWorkspace(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardData(BaseModel):
    stats: DashboardStats
    recent_documents: list[DashboardDocument]
    my_documents: list[DashboardDocument]
    shared_with_me: list[DashboardDocument]
    favorites: list[DashboardDocument]
    activity: list[DashboardActivity]
    workspaces: list[DashboardWorkspace]