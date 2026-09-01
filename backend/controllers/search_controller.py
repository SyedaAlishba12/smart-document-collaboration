"""
Search controller — sits between routes and the (future) search service.

Flow: route -> schema -> controller -> service -> model

Search is fully blocked on Document/Folder/User tables.  All functions
return a clear 501 stub response during development.

TODO: once Document/Folder/User are merged, create
  services/search_service.py  with:
    - search_documents(db, params) -> list[Document]
    - search_folders(db, params) -> list[Folder]
    - search_users(db, params) -> list[User]
  and wire this controller to those functions.
"""

import uuid
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from schemas.search_schema import SearchQueryParams, SearchResultResponse


def _envelope(success: bool, message: str, data: Any = None) -> Dict:
    return {"success": success, "message": message, "data": data}


def _stub_response(query: str, limit: int, offset: int) -> Dict:
    """
    Returns an empty SearchResultResponse envelope.
    Used by all search endpoints until the search service is implemented.
    """
    data = SearchResultResponse(
        query=query,
        total=0,
        limit=limit,
        offset=offset,
        items=[],
    )
    return _envelope(
        success=False,
        message=(
            "Search is not yet implemented — pending Document/Folder/User model merge. "
            "Returning empty result set."
        ),
        data=data,
    )


# ---------------------------------------------------------------------------
# GET /api/search  (global — all resource types)
# ---------------------------------------------------------------------------

async def global_search(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    file_type: Optional[str] = None,
    resource_kind: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """
    Search across documents, folders, and users.

    TODO: delegate to search_service.global_search() once implemented.
    """
    return _stub_response(query=query, limit=limit, offset=offset)


# ---------------------------------------------------------------------------
# GET /api/search/documents
# ---------------------------------------------------------------------------

async def search_documents(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    file_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """
    Search documents only.

    TODO: delegate to search_service.search_documents() once implemented.
    """
    return _stub_response(query=query, limit=limit, offset=offset)


# ---------------------------------------------------------------------------
# GET /api/search/folders
# ---------------------------------------------------------------------------

async def search_folders(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """
    Search folders only.

    TODO: delegate to search_service.search_folders() once implemented.
    """
    return _stub_response(query=query, limit=limit, offset=offset)


# ---------------------------------------------------------------------------
# GET /api/search/users
# ---------------------------------------------------------------------------

async def search_users(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """
    Search users only (useful for the share dialog people-picker).

    TODO: delegate to search_service.search_users() once implemented.
    """
    return _stub_response(query=query, limit=limit, offset=offset)
