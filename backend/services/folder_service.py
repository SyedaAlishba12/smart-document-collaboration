from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.folder import Folder
from schemas.folder_schema import FolderCreate, FolderUpdate, FolderMove


class FolderService:

    @staticmethod
    async def create_folder(
        db: AsyncSession,
        folder_data: FolderCreate
    ) -> Folder:

        # Validate parent folder if provided
        if folder_data.parent_folder_id:
            parent = await db.scalar(
                select(Folder).where(
                    Folder.id == folder_data.parent_folder_id
                )
            )

            if not parent:
                raise ValueError("Parent folder not found")

            if parent.workspace_id != folder_data.workspace_id:
                raise ValueError(
                    "Parent folder must belong to the same workspace"
                )

        new_folder = Folder(
            workspace_id=folder_data.workspace_id,
            parent_folder_id=folder_data.parent_folder_id,
            name=folder_data.name.strip()
        )

        db.add(new_folder)
        await db.commit()
        await db.refresh(new_folder)

        return new_folder

    @staticmethod
    async def get_folder_by_id(
        db: AsyncSession,
        folder_id: UUID
    ) -> Folder | None:

        result = await db.execute(
            select(Folder).where(Folder.id == folder_id)
        )

        return result.scalars().first()

    @staticmethod
    async def get_folders_by_workspace(
        db: AsyncSession,
        workspace_id: UUID
    ) -> list[Folder]:

        result = await db.execute(
            select(Folder)
            .where(Folder.workspace_id == workspace_id)
            .order_by(Folder.name)
        )

        return list(result.scalars().all())

    @staticmethod
    async def update_folder(
        db: AsyncSession,
        folder_id: UUID,
        folder_data: FolderUpdate
    ) -> Folder | None:

        folder = await FolderService.get_folder_by_id(
            db,
            folder_id
        )

        if not folder:
            return None

        if folder_data.name is not None:
            folder.name = folder_data.name.strip()

        await db.commit()
        await db.refresh(folder)

        return folder

    @staticmethod
    async def move_folder(
        db: AsyncSession,
        folder_id: UUID,
        move_data: FolderMove
    ) -> Folder | None:

        folder = await FolderService.get_folder_by_id(
            db,
            folder_id
        )

        if not folder:
            return None

        new_parent_id = move_data.parent_folder_id

        # Moving to root
        if new_parent_id is None:
            folder.parent_folder_id = None

            await db.commit()
            await db.refresh(folder)

            return folder

        # Folder cannot be its own parent
        if new_parent_id == folder.id:
            raise ValueError(
                "A folder cannot be its own parent"
            )

        # Parent must exist
        parent = await FolderService.get_folder_by_id(
            db,
            new_parent_id
        )

        if not parent:
            raise ValueError(
                "Parent folder not found"
            )

        # Parent must belong to same workspace
        if parent.workspace_id != folder.workspace_id:
            raise ValueError(
                "Parent folder must belong to the same workspace"
            )

        folder.parent_folder_id = new_parent_id

        await db.commit()
        await db.refresh(folder)

        return folder

    @staticmethod
    async def delete_folder(
        db: AsyncSession,
        folder_id: UUID
    ) -> bool:

        folder = await FolderService.get_folder_by_id(
            db,
            folder_id
        )

        if not folder:
            return False

        await db.delete(folder)
        await db.commit()

        return True