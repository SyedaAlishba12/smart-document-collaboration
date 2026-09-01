"""
Search routes — REST endpoints for global search.

Paths:
  GET /api/search                — all resource types
  GET /api/search/documents      — documents only
  GET /api/search/folders        — folders only
  GET /api/search/users          — users only (people-picker for share dialog)

All routes:
  - Require an authenticated user.
  - Return {success, message, data} where data is a SearchResultResponse.
  - Currently return empty result sets with a 200 and success=False until the
    search service is implemented (Document/Folder/User models must land first).
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from controllers import search_controller
from middleware.permission_middleware import get_current_user_id, get_db

router = APIRouter(prefix="/api/search", tags=["search"])


# ---------------------------------------------------------------------------
# GET /api/search
# ---------------------------------------------------------------------------

@router.get(
    "",
    summary="Global search across all resource types",
)
async def global_search(
    query: str = Query(..., min_length=1, max_length=500),
    workspace_id: Optional[uuid.UUID] = Query(None),
    file_type: Optional[str] = Query(None, max_length=50),
    resource_kind: Optional[str] = Query(None, pattern="^(document|folder|user)$"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await search_controller.global_search(
        db=db,
        current_user_id=current_user_id,
        query=query,
        workspace_id=workspace_id,
        file_type=file_type,
        resource_kind=resource_kind,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# GET /api/search/documents
# ---------------------------------------------------------------------------

@router.get(
    "/documents",
    summary="Search documents only",
)
async def search_documents(
    query: str = Query(..., min_length=1, max_length=500),
    workspace_id: Optional[uuid.UUID] = Query(None),
    file_type: Optional[str] = Query(None, max_length=50),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await search_controller.search_documents(
        db=db,
        current_user_id=current_user_id,
        query=query,
        workspace_id=workspace_id,
        file_type=file_type,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# GET /api/search/folders
# ---------------------------------------------------------------------------

@router.get(
    "/folders",
    summary="Search folders only",
)
async def search_folders(
    query: str = Query(..., min_length=1, max_length=500),
    workspace_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await search_controller.search_folders(
        db=db,
        current_user_id=current_user_id,
        query=query,
        workspace_id=workspace_id,
        limit=limit,
        offset=offset,
    )


# ---------------------------------------------------------------------------
# GET /api/search/users
# ---------------------------------------------------------------------------

@router.get(
    "/users",
    summary="Search users (for share dialog people-picker)",
)
async def search_users(
    query: str = Query(..., min_length=1, max_length=500),
    workspace_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await search_controller.search_users(
        db=db,
        current_user_id=current_user_id,
        query=query,
        workspace_id=workspace_id,
        limit=limit,
        offset=offset,
    )
