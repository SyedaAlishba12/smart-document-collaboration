from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.comment import Comment
from models.comment_reply import CommentReply
from models.document import Document
from models.notification import NotificationType
from models.user import User
from schemas.activity_log import ActivityLogCreate
from schemas.comment import CommentCreate, CommentReplyCreate, CommentUpdate
from services.activity_log_service import create_activity_log
from services.notification_service import create_notification
from services.permission_service import can_comment


class CommentService:

    @staticmethod
    async def _attach_author_info(
        session: AsyncSession,
        item,
    ):
        """
        Attach author information to a comment or reply.

        The author information is added only to the response object.
        No database columns are created or modified.
        """

        user = await session.get(User, item.user_id)

        if user:
            item.author_name = user.full_name
            item.author_avatar = user.avatar_url
        else:
            item.author_name = None
            item.author_avatar = None

        return item

    @staticmethod
    async def _attach_authors_info(
        session: AsyncSession,
        items,
    ):
        """
        Attach author information to multiple comments/replies
        using one user query instead of querying users individually.
        """

        if not items:
            return items

        user_ids = {
            item.user_id
            for item in items
            if getattr(item, "user_id", None)
        }

        if not user_ids:
            return items

        result = await session.execute(
            select(User).where(User.id.in_(user_ids))
        )

        users = {
            user.id: user
            for user in result.scalars().all()
        }

        for item in items:
            user = users.get(item.user_id)

            if user:
                item.author_name = user.full_name
                item.author_avatar = user.avatar_url
            else:
                item.author_name = None
                item.author_avatar = None

        return items

    @staticmethod
    async def create_comment(
        session: AsyncSession,
        document_id: UUID,
        user_id: UUID,
        data: CommentCreate,
    ):
        if not await can_comment(
            session,
            user_id,
            "document",
            document_id,
        ):
            raise HTTPException(
                status_code=403,
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

        try:
            doc = await session.get(
                Document,
                document_id,
            )

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

        await CommentService._process_mentions(
            session,
            content=data.content,
            resource_type="comment",
            resource_id=comment.id,
        )

        # Attach author information for the API response
        await CommentService._attach_author_info(
            session,
            comment,
        )

        return comment

    @staticmethod
    async def get_document_comments(
        session: AsyncSession,
        document_id: UUID,
    ):
        result = await session.execute(
            select(Comment)
            .where(Comment.document_id == document_id)
            .order_by(Comment.created_at.asc())
        )

        comments = list(result.scalars().all())

        # Attach author names and avatars
        await CommentService._attach_authors_info(
            session,
            comments,
        )

        return comments

    @staticmethod
    async def get_comment(
        session: AsyncSession,
        comment_id: UUID,
    ):
        result = await session.execute(
            select(Comment)
            .where(Comment.id == comment_id)
        )

        comment = result.scalar_one_or_none()

        if comment:
            await CommentService._attach_author_info(
                session,
                comment,
            )

        return comment

    @staticmethod
    async def update_comment(
        session: AsyncSession,
        comment,
        data: CommentUpdate,
    ):
        comment.content = data.content

        await session.commit()
        await session.refresh(comment)

        # Attach author information for the response
        await CommentService._attach_author_info(
            session,
            comment,
        )

        return comment

    @staticmethod
    async def resolve_comment(
        session: AsyncSession,
        comment,
    ):
        comment.status = "resolved"

        await session.commit()
        await session.refresh(comment)

        # Attach author information for the response
        await CommentService._attach_author_info(
            session,
            comment,
        )

        return comment

    @staticmethod
    async def delete_comment(
        session: AsyncSession,
        comment,
    ):
        await session.delete(comment)
        await session.commit()

    @staticmethod
    async def create_reply(
        session: AsyncSession,
        comment_id: UUID,
        user_id: UUID,
        data: CommentReplyCreate,
    ):
        comment = await CommentService.get_comment(
            session,
            comment_id,
        )

        if comment is None:
            raise HTTPException(
                status_code=404,
                detail="Comment not found",
            )

        if not await can_comment(
            session,
            user_id,
            "document",
            comment.document_id,
        ):
            raise HTTPException(
                status_code=403,
                detail="You are not allowed to reply to this comment",
            )

        reply = CommentReply(
            comment_id=comment_id,
            user_id=user_id,
            content=data.content,
        )

        session.add(reply)
        await session.commit()
        await session.refresh(reply)

        await CommentService._process_mentions(
            session,
            content=data.content,
            resource_type="reply",
            resource_id=reply.id,
        )

        # Attach author information for the API response
        await CommentService._attach_author_info(
            session,
            reply,
        )

        return reply

    @staticmethod
    async def get_replies(
        session: AsyncSession,
        comment_id: UUID,
    ):
        result = await session.execute(
            select(CommentReply)
            .where(CommentReply.comment_id == comment_id)
            .order_by(CommentReply.created_at.asc())
        )

        replies = list(result.scalars().all())

        # Attach author names and avatars
        await CommentService._attach_authors_info(
            session,
            replies,
        )

        return replies

    @staticmethod
    async def _process_mentions(
        session: AsyncSession,
        content: str,
        resource_type: str,
        resource_id: UUID,
    ):
        """
        Detect mentions using the complete user's full_name.

        Example:
            "@Zainab Bibi please review this"

        This correctly matches:
            User.full_name == "Zainab Bibi"
        """

        result = await session.execute(
            select(User)
        )

        users = result.scalars().all()

        content_lower = content.lower()

        for user in users:
            mention = f"@{user.full_name}".lower()

            if mention not in content_lower:
                continue

            await create_notification(
                db=session,
                user_id=user.id,
                notification_type=NotificationType.mention,
                resource_type=resource_type,
                resource_id=resource_id,
                message=f"You were mentioned in a {resource_type}: {content}",
            )