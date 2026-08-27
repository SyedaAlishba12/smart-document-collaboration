from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CommentReplyCreate(BaseModel):
    content: str = Field(min_length=1)


class CommentReplyUpdate(BaseModel):
    content: str = Field(min_length=1)


class CommentReplyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    comment_id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime