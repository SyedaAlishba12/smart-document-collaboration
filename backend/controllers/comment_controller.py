from fastapi import HTTPException

from services.comment_service import CommentService


async def create_comment(session, document_id, user_id, data):
    return await CommentService.create_comment(
        session,
        document_id,
        user_id,
        data,
    )


async def get_comments(session, document_id):
    return await CommentService.get_document_comments(
        session,
        document_id,
    )


async def update_comment(session, comment_id, data):
    comment = await CommentService.get_comment(
        session,
        comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    return await CommentService.update_comment(
        session,
        comment,
        data,
    )


async def delete_comment(session, comment_id):
    comment = await CommentService.get_comment(
        session,
        comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    await CommentService.delete_comment(
        session,
        comment,
    )

    return {
        "message": "Comment deleted successfully"
    }


async def resolve_comment(session, comment_id):
    comment = await CommentService.get_comment(
        session,
        comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    return await CommentService.resolve_comment(
        session,
        comment,
    )


async def create_reply(session, comment_id, user_id, data):
    comment = await CommentService.get_comment(
        session,
        comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    return await CommentService.create_reply(
        session,
        comment_id,
        user_id,
        data,
    )


async def get_replies(session, comment_id):
    comment = await CommentService.get_comment(
        session,
        comment_id,
    )

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    return await CommentService.get_replies(
        session,
        comment_id,
    )