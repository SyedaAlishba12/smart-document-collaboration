import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from schemas.activity_log import ActivityLogCreate
from services.activity_log_service import (
    create_activity_log,
    get_activity_log,
    get_workspace_activities,
    get_document_activities,
)


async def create_activity(
    db: AsyncSession,
    activity_data: ActivityLogCreate,
):
    return await create_activity_log(db, activity_data)


async def get_activity(
    db: AsyncSession,
    activity_id: uuid.UUID,
):
    return await get_activity_log(db, activity_id)


async def get_workspace_activity_list(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    limit: int = 20,
):
    return await get_workspace_activities(
        db,
        workspace_id,
        limit,
    )


async def get_document_activity_list(
    db: AsyncSession,
    document_id: uuid.UUID,
    limit: int = 20,
):
    return await get_document_activities(
        db,
        document_id,
        limit,
    )