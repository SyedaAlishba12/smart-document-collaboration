from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.comment import (
    CommentCreate,
    CommentReplyCreate,
    CommentUpdate,
)
from services.comment_service import CommentService


async def create_comment(
    session: AsyncSession,
    document_id: UUID,
    user_id: UUID,
    data: CommentCreate,
):
    return await CommentService.create_comment(
        session, document_id, user_id, data
    )


async def get_comments(
    session: AsyncSession,
    document_id: UUID,
):
    return await CommentService.get_document_comments(session, document_id)


async def update_comment(
    session: AsyncSession,
    comment_id: UUID,
    data: CommentUpdate,
):
    comment = await CommentService.get_comment(session, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return await CommentService.update_comment(session, comment, data)


async def delete_comment(
    session: AsyncSession,
    comment_id: UUID,
):
    comment = await CommentService.get_comment(session, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    await CommentService.delete_comment(session, comment)
    return {"message": "Comment deleted successfully"}


async def resolve_comment(
    session: AsyncSession,
    comment_id: UUID,
):
    comment = await CommentService.get_comment(session, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return await CommentService.resolve_comment(session, comment)


async def create_reply(
    session: AsyncSession,
    comment_id: UUID,
    user_id: UUID,
    data: CommentReplyCreate,
):
    comment = await CommentService.get_comment(session, comment_id)
    if comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )
    return await CommentService.create_reply(
        session, comment_id, user_id, data
    )