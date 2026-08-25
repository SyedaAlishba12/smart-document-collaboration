from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment import Comment
from schemas.comment import CommentCreate, CommentUpdate


class CommentService:

    @staticmethod
    async def create_comment(
        session: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        data: CommentCreate,
    ) -> Comment:
        comment = Comment(
            document_id=document_id,
            user_id=user_id,
            content=data.content,
            status="open",
        )

        session.add(comment)
        await session.commit()
        await session.refresh(comment)

        return comment

    @staticmethod
    async def get_comment(
        session: AsyncSession,
        comment_id: UUID,
    ) -> Comment | None:
        result = await session.execute(
            select(Comment).where(Comment.id == comment_id)
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def get_document_comments(
        session: AsyncSession,
        document_id: UUID,
    ) -> list[Comment]:
        result = await session.execute(
            select(Comment)
            .where(Comment.document_id == document_id)
            .order_by(Comment.created_at.asc())
        )

        return list(result.scalars().all())

    @staticmethod
    async def update_comment(
        session: AsyncSession,
        comment_id: UUID,
        data: CommentUpdate,
    ) -> Comment | None:
        comment = await CommentService.get_comment(
            session,
            comment_id,
        )

        if comment is None:
            return None

        if data.content is not None:
            comment.content = data.content

        if data.status is not None:
            comment.status = data.status

        await session.commit()
        await session.refresh(comment)

        return comment

    @staticmethod
    async def resolve_comment(
        session: AsyncSession,
        comment_id: UUID,
    ) -> Comment | None:
        comment = await CommentService.get_comment(
            session,
            comment_id,
        )

        if comment is None:
            return None

        comment.status = "resolved"

        await session.commit()
        await session.refresh(comment)

        return comment

    @staticmethod
    async def delete_comment(
        session: AsyncSession,
        comment_id: UUID,
    ) -> bool:
        comment = await CommentService.get_comment(
            session,
            comment_id,
        )

        if comment is None:
            return False

        await session.delete(comment)
        await session.commit()

        return True