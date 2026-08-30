import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.activity_log import ActivityLog
from schemas.activity_log import ActivityLogCreate


async def create_activity_log(
    db: AsyncSession,
    activity_data: ActivityLogCreate,
) -> ActivityLog:
    activity = ActivityLog(
        user_id=activity_data.user_id,
        workspace_id=activity_data.workspace_id,
        document_id=activity_data.document_id,
        action=activity_data.action,
        description=activity_data.description,
    )

    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    return activity


async def get_activity_log(
    db: AsyncSession,
    activity_id: uuid.UUID,
) -> ActivityLog | None:

    result = await db.execute(
        select(ActivityLog).where(ActivityLog.id == activity_id)
    )

    return result.scalar_one_or_none()


async def get_workspace_activities(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    limit: int = 20,
) -> list[ActivityLog]:

    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.workspace_id == workspace_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
    )

    return list(result.scalars().all())


async def get_document_activities(
    db: AsyncSession,
    document_id: uuid.UUID,
    limit: int = 20,
) -> list[ActivityLog]:

    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.document_id == document_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
    )

    return list(result.scalars().all())