from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment_reply import CommentReply
from models.user import User
from schemas.comment_reply import CommentReplyCreate, CommentReplyUpdate


class CommentReplyService:

    @staticmethod
    async def _attach_author_info(
        session: AsyncSession,
        reply: CommentReply,
    ):
        """
        Attach author information to a reply for API responses.
        """

        user = await session.get(
            User,
            reply.user_id,
        )

        if user:
            reply.author_name = user.full_name
            reply.author_avatar = user.avatar_url
        else:
            reply.author_name = None
            reply.author_avatar = None

        return reply

    @staticmethod
    async def _attach_authors_info(
        session: AsyncSession,
        replies,
    ):
        """
        Attach author information to multiple replies
        using one user query.
        """

        if not replies:
            return replies

        user_ids = {
            reply.user_id
            for reply in replies
            if getattr(reply, "user_id", None)
        }

        if not user_ids:
            return replies

        result = await session.execute(
            select(User).where(User.id.in_(user_ids))
        )

        users = {
            user.id: user
            for user in result.scalars().all()
        }

        for reply in replies:
            user = users.get(reply.user_id)

            if user:
                reply.author_name = user.full_name
                reply.author_avatar = user.avatar_url
            else:
                reply.author_name = None
                reply.author_avatar = None

        return replies

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

        await CommentReplyService._attach_author_info(
            session,
            reply,
        )

        return reply

    @staticmethod
    async def get_reply(
        session: AsyncSession,
        reply_id: UUID,
    ) -> CommentReply | None:
        result = await session.execute(
            select(CommentReply)
            .where(CommentReply.id == reply_id)
        )

        reply = result.scalar_one_or_none()

        if reply:
            await CommentReplyService._attach_author_info(
                session,
                reply,
            )

        return reply

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

        replies = list(result.scalars().all())

        await CommentReplyService._attach_authors_info(
            session,
            replies,
        )

        return replies

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

        await CommentReplyService._attach_author_info(
            session,
            reply,
        )

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