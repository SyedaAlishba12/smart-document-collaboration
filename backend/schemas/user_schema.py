import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    avatar_url: str | None = None
    status: str | None = None
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    status: str | None = None


class UserSearchResult(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    avatar_url: str | None = None

    class Config:
        from_attributes = True
