from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class TeamBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None

class TeamCreate(TeamBase):
    workspace_id: UUID

class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None

class TeamMemberAdd(BaseModel):
    user_id: UUID
    role: str = Field(default="member", max_length=50)

class TeamMemberResponse(BaseModel):
    id: UUID
    team_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True

class TeamResponse(TeamBase):
    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime
    team_members: List[TeamMemberResponse] = []

    class Config:
        from_attributes = True