import re
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment import Comment
from models.comment_reply import CommentReply
from schemas.comment import CommentCreate, CommentReplyCreate, CommentUpdate


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

        # TODO: Uncomment once Taha's notification_service is ready
        # from services.notification_service import create_notification
        # from models.notification import NotificationType
        #
        # mentions = re.findall(r"@(\w+)", data.content)
        # for username in mentions:
        #     await create_notification(session, user_id, NotificationType.mention, "document", document_id, f"@{username} mentioned you")

        # Temporary mock for development
        mentions = re.findall(r"@(\w+)", data.content)
        for username in mentions:
            print(f"[MOCK] Notify @{username} about comment {comment.id}")

        return comment

    # ... (rest of the methods unchanged)
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
    async def get_comment(
        session: AsyncSession,
        comment_id: UUID,
    ) -> Comment | None:
        result = await session.execute(
            select(Comment).where(Comment.id == comment_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update_comment(
        session: AsyncSession,
        comment: Comment,
        data: CommentUpdate,
    ) -> Comment:
        comment.content = data.content
        await session.commit()
        await session.refresh(comment)
        return comment

    @staticmethod
    async def resolve_comment(
        session: AsyncSession,
        comment: Comment,
    ) -> Comment:
        comment.status = "resolved"
        await session.commit()
        await session.refresh(comment)
        return comment

    @staticmethod
    async def delete_comment(
        session: AsyncSession,
        comment: Comment,
    ) -> None:
        await session.delete(comment)
        await session.commit()

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

        # TODO: Uncomment once Taha's notification_service is ready
        # from services.notification_service import create_notification
        # from models.notification import NotificationType
        #
        # mentions = re.findall(r"@(\w+)", data.content)
        # for username in mentions:
        #     await create_notification(session, user_id, NotificationType.mention, "document", document_id, f"@{username} mentioned you")

        # Temporary mock for development
        mentions = re.findall(r"@(\w+)", data.content)
        for username in mentions:
            print(f"[MOCK] Notify @{username} about reply {reply.id}")

        return reply

    @staticmethod
    async def get_replies(
        session: AsyncSession,
        comment_id: UUID,
    ) -> list[CommentReply]:
        result = await session.execute(
            select(CommentReply)
            .where(CommentReply.comment_id == comment_id)
            .order_by(CommentReply.created_at.asc())
        )
        return list(result.scalars().all())