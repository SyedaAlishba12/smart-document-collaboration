import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.activity_log import ActivityLog
from models.document import Document
from models.folder import Folder
from models.permission import Permission, PermissionLevel
from models.workspace import Workspace
from models.workspace_member import WorkspaceMember


class DashboardService:
    """Service responsible for aggregating dashboard data."""

    @staticmethod
    async def get_user_workspace_ids(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        """Return workspace IDs where the user is a member."""

        result = await db.execute(
            select(WorkspaceMember.workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        )

        return list(result.scalars().all())

    @staticmethod
    async def get_stats(
        db: AsyncSession,
        user_id: uuid.UUID,
        workspace_ids: list[uuid.UUID],
    ) -> dict[str, int]:
        """Return dashboard summary counts."""

        my_documents_result = await db.execute(
            select(func.count(Document.id))
            .where(Document.owner_id == user_id)
        )
        my_documents = my_documents_result.scalar_one()

        shared_result = await db.execute(
            select(func.count(func.distinct(Permission.document_id)))
            .join(
                Document,
                Document.id == Permission.document_id,
            )
            .where(
                Permission.user_id == user_id,
                Permission.permission_level != PermissionLevel.owner,
                Document.owner_id != user_id,
            )
        )
        shared_with_me = shared_result.scalar_one()

        folders = 0

        if workspace_ids:
            folders_result = await db.execute(
                select(func.count(Folder.id))
                .where(Folder.workspace_id.in_(workspace_ids))
            )
            folders = folders_result.scalar_one()

        return {
            "my_documents": my_documents,
            "shared_with_me": shared_with_me,
            "folders": folders,
            "workspaces": len(workspace_ids),
        }

    @staticmethod
    async def get_recent_documents(
        db: AsyncSession,
        user_id: uuid.UUID,
        workspace_ids: list[uuid.UUID],
        limit: int = 10,
    ) -> list[Document]:
        """Return recently updated documents accessible to the user."""

        if not workspace_ids:
            return []

        result = await db.execute(
            select(Document)
            .where(
                Document.workspace_id.in_(workspace_ids),
                Document.is_archived.is_(False),
            )
            .order_by(Document.updated_at.desc())
            .limit(limit)
        )

        return list(result.scalars().all())

    @staticmethod
    async def get_my_documents(
        db: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 20,
    ) -> list[Document]:
        """Return documents owned by the authenticated user."""

        result = await db.execute(
            select(Document)
            .where(
                Document.owner_id == user_id,
                Document.is_archived.is_(False),
            )
            .order_by(Document.updated_at.desc())
            .limit(limit)
        )

        return list(result.scalars().all())

    @staticmethod
    async def get_shared_with_me(
        db: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 20,
    ) -> list[Document]:
        """Return documents explicitly shared with the authenticated user."""

        result = await db.execute(
            select(Document)
            .join(
                Permission,
                Permission.document_id == Document.id,
            )
            .where(
                Permission.user_id == user_id,
                Permission.permission_level != PermissionLevel.owner,
                Document.owner_id != user_id,
                Document.is_archived.is_(False),
            )
            .order_by(Document.updated_at.desc())
            .limit(limit)
        )

        return list(result.scalars().unique().all())

    @staticmethod
    async def get_favorites(
        db: AsyncSession,
        user_id: uuid.UUID,
        workspace_ids: list[uuid.UUID],
        limit: int = 20,
    ) -> list[Document]:
        """
        Return favorite documents accessible to the user.

        Favorites currently live on the Document model, so the dashboard
        respects the existing project schema.
        """

        if not workspace_ids:
            return []

        result = await db.execute(
            select(Document)
            .where(
                Document.workspace_id.in_(workspace_ids),
                Document.is_favorite.is_(True),
                Document.is_archived.is_(False),
            )
            .order_by(Document.updated_at.desc())
            .limit(limit)
        )

        return list(result.scalars().all())

    @staticmethod
    async def get_activity(
        db: AsyncSession,
        workspace_ids: list[uuid.UUID],
        limit: int = 20,
    ) -> list[ActivityLog]:
        """Return recent activity from the user's workspaces."""

        if not workspace_ids:
            return []

        result = await db.execute(
            select(ActivityLog)
            .where(ActivityLog.workspace_id.in_(workspace_ids))
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        )

        return list(result.scalars().all())

    @staticmethod
    async def get_workspaces(
        db: AsyncSession,
        workspace_ids: list[uuid.UUID],
    ) -> list[Workspace]:
        """Return the user's workspaces."""

        if not workspace_ids:
            return []

        result = await db.execute(
            select(Workspace)
            .where(Workspace.id.in_(workspace_ids))
            .order_by(Workspace.created_at.asc())
        )

        return list(result.scalars().all())

    @classmethod
    async def get_dashboard_data(
        cls,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> dict:
        """Return the complete dashboard payload."""

        workspace_ids = await cls.get_user_workspace_ids(
            db,
            user_id,
        )

        stats = await cls.get_stats(
            db,
            user_id,
            workspace_ids,
        )

        recent_documents = await cls.get_recent_documents(
            db,
            user_id,
            workspace_ids,
        )

        my_documents = await cls.get_my_documents(
            db,
            user_id,
        )

        shared_with_me = await cls.get_shared_with_me(
            db,
            user_id,
        )

        favorites = await cls.get_favorites(
            db,
            user_id,
            workspace_ids,
        )

        activity = await cls.get_activity(
            db,
            workspace_ids,
        )

        workspaces = await cls.get_workspaces(
            db,
            workspace_ids,
        )

        return {
            "stats": stats,
            "recent_documents": recent_documents,
            "my_documents": my_documents,
            "shared_with_me": shared_with_me,
            "favorites": favorites,
            "activity": activity,
            "workspaces": workspaces,
        }