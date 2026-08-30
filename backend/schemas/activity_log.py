import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ActivityLogCreate(BaseModel):
    user_id: uuid.UUID
    workspace_id: uuid.UUID
    document_id: uuid.UUID | None = None
    action: str
    description: str | None = None


class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    workspace_id: uuid.UUID
    document_id: uuid.UUID | None
    action: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)