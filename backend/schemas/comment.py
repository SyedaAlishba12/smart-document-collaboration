from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    user_id: UUID
    content: str
    status: str
    created_at: datetime
    updated_at: datetime

    # Author information
    author_name: str | None = None
    author_avatar: str | None = None


class CommentReplyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    comment_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime

    # Author information
    author_name: str | None = None
    author_avatar: str | None = None