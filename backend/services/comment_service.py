import re
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment import Comment
from models.comment_reply import CommentReply
from schemas.comment import CommentCreate, CommentReplyCreate, CommentUpdate

from services.permission_service import can_comment
from services.notification_service import create_notification
from models.notification import NotificationType
from models.user import User

# Syeda's Activity Log
from models.document import Document
from services.activity_log_service import create_activity_log
from schemas.activity_log import ActivityLogCreate


class CommentService:

    @staticmethod
    async def create_comment(
        session: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        data: CommentCreate,
    ) -> Comment:
        # Permission check
        if not await can_comment(session, user_id, "document", document_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not allowed to comment on this document",
            )

        comment = Comment(
            document_id=document_id,
            user_id=user_id,
            content=data.content,
            status="open",
        )
        session.add(comment)
        await session.commit()
        await session.refresh(comment)

        # Activity log
        try:
            doc = await session.get(Document, document_id)
            if doc:
                await create_activity_log(
                    session,
                    ActivityLogCreate(
                        user_id=user_id,
                        workspace_id=doc.workspace_id,
                        document_id=document_id,
                        action="comment_created",
                        description=f"Added a comment: {data.content[:50]}...",
                    ),
                )
        except Exception as e:
            print(f"[Activity Log Error]: {e}")

        # Mentions → notifications
        mentions = re.findall(r"@(\w+)", data.content)
        for username in mentions:
            # find user by full_name (or username - adjust as needed)
            result = await session.execute(
                select(User).where(User.full_name == username)
            )
            mentioned_user = result.scalar_one_or_none()
            if mentioned_user:
                await create_notification(
                    db=session,
                    user_id=mentioned_user.id,
                    notification_type=NotificationType.mention,
                    resource_type="comment",
                    resource_id=comment.id,
                    message=f"You were mentioned in a comment: {data.content}",
                )

        return comment

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
        # Ensure the parent comment exists and permission is checked (could be inherited)
        reply = CommentReply(
            comment_id=comment_id,
            user_id=user_id,
            content=data.content,
        )
        session.add(reply)
        await session.commit()
        await session.refresh(reply)

        # Mentions → notifications
        mentions = re.findall(r"@(\w+)", data.content)
        for username in mentions:
            result = await session.execute(
                select(User).where(User.full_name == username)
            )
            mentioned_user = result.scalar_one_or_none()
            if mentioned_user:
                await create_notification(
                    db=session,
                    user_id=mentioned_user.id,
                    notification_type=NotificationType.mention,
                    resource_type="reply",
                    resource_id=reply.id,
                    message=f"You were mentioned in a reply: {data.content}",
                )

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