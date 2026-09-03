import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from schemas.dashboard import (
    DashboardActivity,
    DashboardData,
    DashboardDocument,
    DashboardStats,
    DashboardWorkspace,
)
from services.dashboard_service import DashboardService


class DashboardController:
    """Controller for dashboard aggregation endpoints."""

    @staticmethod
    async def get_dashboard(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        """Return the complete dashboard."""

        data = await DashboardService.get_dashboard_data(
            db,
            user_id,
        )

        return {
            "success": True,
            "message": "Dashboard data fetched successfully",
            "data": DashboardData(
                stats=DashboardStats(**data["stats"]),
                recent_documents=[
                    DashboardDocument.model_validate(document)
                    for document in data["recent_documents"]
                ],
                my_documents=[
                    DashboardDocument.model_validate(document)
                    for document in data["my_documents"]
                ],
                shared_with_me=[
                    DashboardDocument.model_validate(document)
                    for document in data["shared_with_me"]
                ],
                favorites=[
                    DashboardDocument.model_validate(document)
                    for document in data["favorites"]
                ],
                activity=[
                    DashboardActivity.model_validate(item)
                    for item in data["activity"]
                ],
                workspaces=[
                    DashboardWorkspace.model_validate(workspace)
                    for workspace in data["workspaces"]
                ],
            ),
        }

    @staticmethod
    async def get_recent_documents(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        workspace_ids = await DashboardService.get_user_workspace_ids(
            db,
            user_id,
        )

        documents = await DashboardService.get_recent_documents(
            db,
            user_id,
            workspace_ids,
        )

        return {
            "success": True,
            "message": "Recent documents fetched successfully",
            "data": [
                DashboardDocument.model_validate(document)
                for document in documents
            ],
        }

    @staticmethod
    async def get_my_documents(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        documents = await DashboardService.get_my_documents(
            db,
            user_id,
        )

        return {
            "success": True,
            "message": "My documents fetched successfully",
            "data": [
                DashboardDocument.model_validate(document)
                for document in documents
            ],
        }

    @staticmethod
    async def get_shared_with_me(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        documents = await DashboardService.get_shared_with_me(
            db,
            user_id,
        )

        return {
            "success": True,
            "message": "Shared documents fetched successfully",
            "data": [
                DashboardDocument.model_validate(document)
                for document in documents
            ],
        }

    @staticmethod
    async def get_favorites(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        workspace_ids = await DashboardService.get_user_workspace_ids(
            db,
            user_id,
        )

        documents = await DashboardService.get_favorites(
            db,
            user_id,
            workspace_ids,
        )

        return {
            "success": True,
            "message": "Favorite documents fetched successfully",
            "data": [
                DashboardDocument.model_validate(document)
                for document in documents
            ],
        }

    @staticmethod
    async def get_activity(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        workspace_ids = await DashboardService.get_user_workspace_ids(
            db,
            user_id,
        )

        activities = await DashboardService.get_activity(
            db,
            workspace_ids,
        )

        return {
            "success": True,
            "message": "Dashboard activity fetched successfully",
            "data": [
                DashboardActivity.model_validate(activity)
                for activity in activities
            ],
        }

    @staticmethod
    async def get_workspaces(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        workspace_ids = await DashboardService.get_user_workspace_ids(
            db,
            user_id,
        )

        workspaces = await DashboardService.get_workspaces(
            db,
            workspace_ids,
        )

        return {
            "success": True,
            "message": "Workspaces fetched successfully",
            "data": [
                DashboardWorkspace.model_validate(workspace)
                for workspace in workspaces
            ],
        }