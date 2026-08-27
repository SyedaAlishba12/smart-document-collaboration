from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from services.folder_service import FolderService
from schemas.folder_schema import (
    FolderCreate,
    FolderUpdate,
    FolderMove
)


class FolderController:

    @staticmethod
    async def create_folder(
        db: AsyncSession,
        folder_data: FolderCreate
    ):
        try:
            folder = await FolderService.create_folder(
                db,
                folder_data
            )

            return {
                "success": True,
                "message": "Folder created successfully",
                "data": folder
            }

        except ValueError as e:
            return {
                "success": False,
                "message": str(e),
                "data": None
            }

    @staticmethod
    async def get_folder(
        db: AsyncSession,
        folder_id: UUID
    ):
        folder = await FolderService.get_folder_by_id(
            db,
            folder_id
        )

        if not folder:
            return {
                "success": False,
                "message": "Folder not found",
                "data": None
            }

        return {
            "success": True,
            "message": "Folder fetched successfully",
            "data": folder
        }

    @staticmethod
    async def get_workspace_folders(
        db: AsyncSession,
        workspace_id: UUID
    ):
        folders = await FolderService.get_folders_by_workspace(
            db,
            workspace_id
        )

        return {
            "success": True,
            "message": "Folders fetched successfully",
            "data": folders
        }

    @staticmethod
    async def update_folder(
        db: AsyncSession,
        folder_id: UUID,
        folder_data: FolderUpdate
    ):
        folder = await FolderService.update_folder(
            db,
            folder_id,
            folder_data
        )

        if not folder:
            return {
                "success": False,
                "message": "Folder not found",
                "data": None
            }

        return {
            "success": True,
            "message": "Folder updated successfully",
            "data": folder
        }

    @staticmethod
    async def move_folder(
        db: AsyncSession,
        folder_id: UUID,
        move_data: FolderMove
    ):
        try:
            folder = await FolderService.move_folder(
                db,
                folder_id,
                move_data
            )

            if not folder:
                return {
                    "success": False,
                    "message": "Folder not found",
                    "data": None
                }

            return {
                "success": True,
                "message": "Folder moved successfully",
                "data": folder
            }

        except ValueError as e:
            return {
                "success": False,
                "message": str(e),
                "data": None
            }

    @staticmethod
    async def delete_folder(
        db: AsyncSession,
        folder_id: UUID
    ):
        success = await FolderService.delete_folder(
            db,
            folder_id
        )

        if not success:
            return {
                "success": False,
                "message": "Folder not found",
                "data": None
            }

        return {
            "success": True,
            "message": "Folder deleted successfully",
            "data": None
        }