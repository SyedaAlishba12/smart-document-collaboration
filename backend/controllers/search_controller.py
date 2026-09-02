"""
Search controller — sits between routes and search_service.

Flow: route -> schema -> controller -> service -> model

All functions delegate to services/search_service.py.  The service handles:
  - Permission-aware document filtering (JOIN against Permission table).
  - Folder search (workspace-scoped; no fine-grained permission — open question).
  - User search (intentionally broad — needed for share-dialog people-picker).

PREVIOUS STUB NOTE: This controller previously returned empty 501 stubs while
Document/Folder/User were absent from this branch.  It now calls the real
service, which resolves those models via SQLAlchemy's class registry at
runtime.  The models must be registered (either real imports or test stubs)
before any request is processed.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from schemas.search_schema import SearchResultResponse
import services.search_service as ssvc


def _envelope(success: bool, message: str, data: Any = None) -> Dict:
    return {"success": success, "message": message, "data": data}


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
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """
    Search across documents, folders, and users.

    resource_kind may narrow results to a single type:
      "document" -> only document results
      "folder"   -> only folder results
      "user"     -> only user results
      None       -> all three combined (search_all)
    """
    if resource_kind == "document":
        result = await ssvc.search_documents(
            db, current_user_id, query,
            workspace_id=workspace_id, file_type=file_type,
            date_from=date_from, date_to=date_to,
            limit=limit, offset=offset,
        )
    elif resource_kind == "folder":
        result = await ssvc.search_folders(
            db, current_user_id, query,
            workspace_id=workspace_id,
            limit=limit, offset=offset,
        )
    elif resource_kind == "user":
        result = await ssvc.search_users(
            db, query,
            limit=limit, offset=offset,
        )
    else:
        result = await ssvc.search_all(
            db, current_user_id, query,
            workspace_id=workspace_id, file_type=file_type,
            date_from=date_from, date_to=date_to,
            limit=limit, offset=offset,
        )

    return _envelope(success=True, message="Search completed.", data=result.model_dump(mode="json"))


# ---------------------------------------------------------------------------
# GET /api/search/documents
# ---------------------------------------------------------------------------

async def search_documents(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    file_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict:
    """
    Permission-aware document search.

    Only returns documents the current_user_id has an explicit Permission row
    for — no permission row means the document is invisible to this user.
    """
    result = await ssvc.search_documents(
        db, current_user_id, query,
        workspace_id=workspace_id, file_type=file_type,
        date_from=date_from, date_to=date_to,
        limit=limit, offset=offset,
    )
    return _envelope(success=True, message="Document search completed.", data=result.model_dump(mode="json"))


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
    Folder name search, optionally workspace-scoped.

    NOTE: Folder has no fine-grained permission control (confirmed — no
    Permission relationship on folder.py).  Results are scoped to workspace_id
    if supplied; otherwise all workspaces are searched.  Flag open for team.
    """
    result = await ssvc.search_folders(
        db, current_user_id, query,
        workspace_id=workspace_id,
        limit=limit, offset=offset,
    )
    return _envelope(success=True, message="Folder search completed.", data=result.model_dump(mode="json"))


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
    Broad user search for the share-dialog people-picker.

    Not permission-gated by design — callers need to find any registered user.
    workspace_id is accepted for API consistency but not used here; see
    search_service.search_users() for the reasoning.
    """
    result = await ssvc.search_users(
        db, query,
        limit=limit, offset=offset,
    )
    return _envelope(success=True, message="User search completed.", data=result.model_dump(mode="json"))
