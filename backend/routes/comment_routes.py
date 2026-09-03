from uuid import UUID

from fastapi import APIRouter, Depends, status

from sqlalchemy.ext.asyncio import AsyncSession

from common.auth_dependency import get_current_user_id

from controllers.comment_controller import (
    create_comment,
    create_reply,
    delete_comment,
    get_comments,
    get_replies,
    resolve_comment,
    update_comment,
)

from database.session import get_db

from schemas.comment import (
    CommentCreate,
    CommentReplyCreate,
    CommentReplyResponse,
    CommentResponse,
    CommentUpdate,
)

router = APIRouter(prefix="/api", tags=["Comments"])


@router.post(
    "/documents/{document_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    document_id: UUID,
    data: CommentCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await create_comment(
        session,
        document_id,
        user_id,
        data,
    )


@router.get(
    "/documents/{document_id}/comments",
    response_model=list[CommentResponse],
)
async def list_comments(
    document_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    return await get_comments(
        session,
        document_id,
    )


@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse,
)
async def edit_comment(
    comment_id: UUID,
    data: CommentUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await update_comment(
        session,
        comment_id,
        data,
    )


@router.delete(
    "/comments/{comment_id}",
)
async def remove_comment(
    comment_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await delete_comment(
        session,
        comment_id,
    )


@router.post(
    "/comments/{comment_id}/resolve",
    response_model=CommentResponse,
)
async def resolve(
    comment_id: UUID,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await resolve_comment(
        session,
        comment_id,
    )


@router.post(
    "/comments/{comment_id}/replies",
    response_model=CommentReplyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_reply(
    comment_id: UUID,
    data: CommentReplyCreate,
    session: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id),
):
    return await create_reply(
        session,
        comment_id,
        user_id,
        data,
    )


@router.get(
    "/comments/{comment_id}/replies",
    response_model=list[CommentReplyResponse],
)
async def list_replies(
    comment_id: UUID,
    session: AsyncSession = Depends(get_db),
):
    return await get_replies(
        session,
        comment_id,
    )