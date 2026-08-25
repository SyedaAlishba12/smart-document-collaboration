from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from database.session import AsyncSessionLocal
from schemas.comment import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
)
from services.comment_service import CommentService


router = APIRouter(
    prefix="/api",
    tags=["Comments"],
)


@router.post(
    "/documents/{document_id}/comments",
    response_model=CommentResponse,
    status_code=201,
)
async def create_comment(
    document_id: UUID,
    data: CommentCreate,
    user_id: UUID = Query(...),
):
    async with AsyncSessionLocal() as session:
        return await CommentService.create_comment(
            session=session,
            document_id=document_id,
            user_id=user_id,
            data=data,
        )


@router.get(
    "/documents/{document_id}/comments",
    response_model=list[CommentResponse],
)
async def get_document_comments(
    document_id: UUID,
):
    async with AsyncSessionLocal() as session:
        return await CommentService.get_document_comments(
            session=session,
            document_id=document_id,
        )


@router.get(
    "/comments/{comment_id}",
    response_model=CommentResponse,
)
async def get_comment(
    comment_id: UUID,
):
    async with AsyncSessionLocal() as session:
        comment = await CommentService.get_comment(
            session=session,
            comment_id=comment_id,
        )

        if comment is None:
            raise HTTPException(
                status_code=404,
                detail="Comment not found",
            )

        return comment


@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse,
)
async def update_comment(
    comment_id: UUID,
    data: CommentUpdate,
):
    async with AsyncSessionLocal() as session:
        comment = await CommentService.update_comment(
            session=session,
            comment_id=comment_id,
            data=data,
        )

        if comment is None:
            raise HTTPException(
                status_code=404,
                detail="Comment not found",
            )

        return comment


@router.patch(
    "/comments/{comment_id}/resolve",
    response_model=CommentResponse,
)
async def resolve_comment(
    comment_id: UUID,
):
    async with AsyncSessionLocal() as session:
        comment = await CommentService.resolve_comment(
            session=session,
            comment_id=comment_id,
        )

        if comment is None:
            raise HTTPException(
                status_code=404,
                detail="Comment not found",
            )

        return comment


@router.delete(
    "/comments/{comment_id}",
    status_code=204,
)
async def delete_comment(
    comment_id: UUID,
):
    async with AsyncSessionLocal() as session:
        deleted = await CommentService.delete_comment(
            session=session,
            comment_id=comment_id,
        )

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Comment not found",
            )

        return None