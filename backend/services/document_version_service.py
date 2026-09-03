from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.document_version import DocumentVersion
from models.user import User


class DocumentVersionService:

    @staticmethod
    async def create_version(
        session: AsyncSession,
        document_id: UUID,
        created_by: UUID,
        content: str,
    ) -> DocumentVersion:
        result = await session.execute(
            select(func.max(DocumentVersion.version_number))
            .where(DocumentVersion.document_id == document_id)
        )

        latest = result.scalar_one_or_none() or 0

        version = DocumentVersion(
            document_id=document_id,
            created_by=created_by,
            version_number=latest + 1,
            content=content,
        )

        session.add(version)

        await session.commit()
        await session.refresh(version)

        # Load author information for the response
        user_result = await session.execute(
            select(User).where(User.id == created_by)
        )
        user = user_result.scalar_one_or_none()

        version.author_name = user.full_name if user else None
        version.author_avatar = user.avatar_url if user else None

        return version

    @staticmethod
    async def get_version(
        session: AsyncSession,
        version_id: UUID,
    ) -> DocumentVersion | None:

        result = await session.execute(
            select(DocumentVersion).where(
                DocumentVersion.id == version_id
            )
        )

        version = result.scalar_one_or_none()

        if version is None:
            return None

        # Load author information
        user_result = await session.execute(
            select(User).where(User.id == version.created_by)
        )

        user = user_result.scalar_one_or_none()

        version.author_name = user.full_name if user else None
        version.author_avatar = user.avatar_url if user else None

        return version

    @staticmethod
    async def get_document_versions(
        session: AsyncSession,
        document_id: UUID,
    ) -> list[DocumentVersion]:

        result = await session.execute(
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(desc(DocumentVersion.version_number))
        )

        versions = list(result.scalars().all())

        if not versions:
            return versions

        # Get all authors in one query instead of querying once per version
        author_ids = {version.created_by for version in versions}

        users_result = await session.execute(
            select(User).where(User.id.in_(author_ids))
        )

        users = {
            user.id: user
            for user in users_result.scalars().all()
        }

        for version in versions:
            user = users.get(version.created_by)

            version.author_name = user.full_name if user else None
            version.author_avatar = user.avatar_url if user else None

        return versions

    @staticmethod
    async def get_latest_version(
        session: AsyncSession,
        document_id: UUID,
    ) -> DocumentVersion | None:

        result = await session.execute(
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(desc(DocumentVersion.version_number))
            .limit(1)
        )

        version = result.scalar_one_or_none()

        if version is None:
            return None

        # Load author information
        user_result = await session.execute(
            select(User).where(User.id == version.created_by)
        )

        user = user_result.scalar_one_or_none()

        version.author_name = user.full_name if user else None
        version.author_avatar = user.avatar_url if user else None

        return version