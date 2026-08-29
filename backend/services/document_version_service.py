from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.document_version import DocumentVersion


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
        return version

    @staticmethod
    async def get_version(
        session: AsyncSession,
        version_id: UUID,
    ) -> DocumentVersion | None:
        result = await session.execute(
            select(DocumentVersion).where(DocumentVersion.id == version_id)
        )
        return result.scalar_one_or_none()

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
        return list(result.scalars().all())

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
        return result.scalar_one_or_none()