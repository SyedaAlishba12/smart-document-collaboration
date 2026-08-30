from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentVersionCreate(BaseModel):
    content: str = Field(min_length=1)


class DocumentVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    document_id: UUID
    created_by: UUID
    version_number: int
    content: str
    created_at: datetime