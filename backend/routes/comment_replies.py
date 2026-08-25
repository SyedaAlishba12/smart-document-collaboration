from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from database.session import AsyncSessionLocal
from schemas.comment_reply import (
    CommentReplyCreate,
    CommentReplyResponse,
    CommentReplyUpdate,
)
from services.comment_reply_service import CommentReplyService


router = APIRouter(
    prefix="/api",
    tags=["Comment Replies"],
)


@router.post(
    "/comments/{comment_id}/replies",
    response_model=CommentReplyResponse,
    status_code=201,
)
async def create_reply(
    comment_id: UUID,
    data: CommentReplyCreate,
    user_id: UUID = Query(...),
):
    async with AsyncSessionLocal() as session:
        return await CommentReplyService.create_reply(
            session=session,
            comment_id=comment_id,
            user_id=user_id,
            data=data,
        )


@router.get(
    "/comments/{comment_id}/replies",
    response_model=list[CommentReplyResponse],
)
async def get_comment_replies(
    comment_id: UUID,
):
    async with AsyncSessionLocal() as session:
        return await CommentReplyService.get_comment_replies(
            session=session,
            comment_id=comment_id,
        )


@router.get(
    "/replies/{reply_id}",
    response_model=CommentReplyResponse,
)
async def get_reply(
    reply_id: UUID,
):
    async with AsyncSessionLocal() as session:
        reply = await CommentReplyService.get_reply(
            session=session,
            reply_id=reply_id,
        )

        if reply is None:
            raise HTTPException(
                status_code=404,
                detail="Comment reply not found",
            )

        return reply


@router.put(
    "/replies/{reply_id}",
    response_model=CommentReplyResponse,
)
async def update_reply(
    reply_id: UUID,
    data: CommentReplyUpdate,
):
    async with AsyncSessionLocal() as session:
        reply = await CommentReplyService.update_reply(
            session=session,
            reply_id=reply_id,
            data=data,
        )

        if reply is None:
            raise HTTPException(
                status_code=404,
                detail="Comment reply not found",
            )

        return reply


@router.delete(
    "/replies/{reply_id}",
    status_code=204,
)
async def delete_reply(
    reply_id: UUID,
):
    async with AsyncSessionLocal() as session:
        deleted = await CommentReplyService.delete_reply(
            session=session,
            reply_id=reply_id,
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Comment reply not found",
            )

        return None