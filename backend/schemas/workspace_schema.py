import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WorkspaceRole(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class WorkspaceCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Workspace name cannot be empty")
        return value


class WorkspaceUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Workspace name cannot be empty")
        return value


class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    description: str | None = None
    created_at: datetime
    updated_at: datetime


class WorkspaceMemberAddRequest(BaseModel):
    user_id: uuid.UUID
    role: WorkspaceRole = WorkspaceRole.member


class WorkspaceMemberUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    avatar_url: str | None = None


class WorkspaceMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workspace_id: uuid.UUID
    user_id: uuid.UUID
    role: WorkspaceRole
    joined_at: datetime
    user: WorkspaceMemberUserResponse


class WorkspaceEnvelope(BaseModel):
    success: bool = True
    message: str
    data: WorkspaceResponse | list[WorkspaceResponse] | None


class WorkspaceMemberEnvelope(BaseModel):
    success: bool = True
    message: str
    data: WorkspaceMemberResponse | list[WorkspaceMemberResponse] | None


class MessageEnvelope(BaseModel):
    success: bool = True
    message: str
    data: None = None
