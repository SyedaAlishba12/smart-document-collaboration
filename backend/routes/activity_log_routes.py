import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from schemas.activity_log import (
    ActivityLogCreate,
    ActivityLogResponse,
)
from controllers.activity_log_controller import (
    create_activity,
    get_activity,
    get_workspace_activity_list,
    get_document_activity_list,
)


router = APIRouter(
    prefix="/api/activity",
    tags=["Activity Log"],
)


@router.post(
    "",
    response_model=ActivityLogResponse,
)
async def create_activity_log_route(
    activity_data: ActivityLogCreate,
    db: AsyncSession = Depends(get_db),
):
    return await create_activity(
        db,
        activity_data,
    )


@router.get(
    "/{activity_id}",
    response_model=ActivityLogResponse,
)
async def get_activity_log_route(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    activity = await get_activity(
        db,
        activity_id,
    )

    if not activity:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    return activity


@router.get(
    "/workspace/{workspace_id}",
    response_model=list[ActivityLogResponse],
)
async def get_workspace_activities_route(
    workspace_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await get_workspace_activity_list(
        db,
        workspace_id,
        limit,
    )


@router.get(
    "/document/{document_id}",
    response_model=list[ActivityLogResponse],
)
async def get_document_activities_route(
    document_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await get_document_activity_list(
        db,
        document_id,
        limit,
    )