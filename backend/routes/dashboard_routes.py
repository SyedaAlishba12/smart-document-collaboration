from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from controllers.dashboard_controller import DashboardController
from database.session import get_db
from middleware.auth_middleware import get_current_user
from models.user import User


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_dashboard(
        db,
        current_user.id,
    )


@router.get("/recent_documents")
async def get_recent_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_recent_documents(
        db,
        current_user.id,
    )


@router.get("/my_documents")
async def get_my_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_my_documents(
        db,
        current_user.id,
    )


@router.get("/shared_with_me")
async def get_shared_with_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_shared_with_me(
        db,
        current_user.id,
    )


@router.get("/favorites")
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_favorites(
        db,
        current_user.id,
    )


@router.get("/activity")
async def get_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_activity(
        db,
        current_user.id,
    )


@router.get("/workspaces")
async def get_workspaces(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DashboardController.get_workspaces(
        db,
        current_user.id,
    )