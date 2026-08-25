from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment_reply import CommentReply
from schemas.comment_reply import CommentReplyCreate, CommentReplyUpdate


class CommentReplyService:

    @staticmethod
    async def create_reply(
        session: AsyncSession,
        comment_id: UUID,
        user_id: UUID,
        data: CommentReplyCreate,
    ) -> CommentReply:
        reply = CommentReply(
            comment_id=comment_id,
            user_id=user_id,
            content=data.content,
        )

        session.add(reply)
        await session.commit()
        await session.refresh(reply)

        return reply

    @staticmethod
    async def get_reply(
        session: AsyncSession,
        reply_id: UUID,
    ) -> CommentReply | None:
        result = await session.execute(
            select(CommentReply).where(
                CommentReply.id == reply_id
            )
        )

        return result.scalar_one_or_none()

    @staticmethod
    async def get_comment_replies(
        session: AsyncSession,
        comment_id: UUID,
    ) -> list[CommentReply]:
        result = await session.execute(
            select(CommentReply)
            .where(CommentReply.comment_id == comment_id)
            .order_by(CommentReply.created_at.asc())
        )

        return list(result.scalars().all())

    @staticmethod
    async def update_reply(
        session: AsyncSession,
        reply_id: UUID,
        data: CommentReplyUpdate,
    ) -> CommentReply | None:
        reply = await CommentReplyService.get_reply(
            session,
            reply_id,
        )

        if reply is None:
            return None

        reply.content = data.content

        await session.commit()
        await session.refresh(reply)

        return reply

    @staticmethod
    async def delete_reply(
        session: AsyncSession,
        reply_id: UUID,
    ) -> bool:
        reply = await CommentReplyService.get_reply(
            session,
            reply_id,
        )

        if reply is None:
            return False

        await session.delete(reply)
        await session.commit()

        return True