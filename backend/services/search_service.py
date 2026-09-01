"""
Search service — real async SQLAlchemy 2.0 implementations.

All queries are async-only (team rule: no sync SQLAlchemy anywhere).

ORDERING DECISION:
    Documents and folders are ordered by created_at DESC (newest first).
    Rationale: in the absence of a full-text ranking score from pg_tsvector,
    recency is the most useful secondary sort.  Once ts_rank is available,
    replace ORDER BY created_at DESC with ORDER BY rank DESC, created_at DESC.

PERMISSION MODEL (documents):
    Search NEVER returns a document unless the requesting user has at least one
    Permission row for (user_id, document_id).  This is enforced via a subquery
    EXISTS check — not a post-filter — so the database never reads unauthorised
    rows into Python memory.

FOLDER ACCESS MODEL:
    Folder has NO permission relationship (confirmed: folder.py on
    feature/documents-editor-files has no permissions FK).  Folder access is
    therefore workspace-scoped: a folder is considered accessible if the caller
    supplies a workspace_id filter, or broadly if they do not.
    OPEN QUESTION FOR TEAM: should WorkspaceMember (or a future folderPermission
    table) gate folder visibility?  Until that model lands, search_folders returns
    all name-matching folders in the requested workspace (or all workspaces if
    workspace_id is not supplied).  Flag raised here so the team can decide.

USER SEARCH (broad):
    User lookup is intentionally not permission-gated — it is used by the share
    dialog people-picker and must surface any registered user so the sharer can
    find them.  This matches standard product behaviour (e.g. Google Docs "Share"
    dialog).  If the product spec changes to require restricted user lookup
    (e.g. workspace-member-only), add a WorkspaceMember JOIN here.

FILE TYPE FILTER:
    Document has no file_type column (confirmed from Zainab's model).  The
    file_type query parameter is accepted by the route for API stability, but
    this service ignores it and notes the gap.  Add the filter once Zainab's
    team adds a file_type column to Document.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.permission import Permission
from schemas.search_schema import SearchResultItem, SearchResultResponse


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _document_item(row: Any) -> SearchResultItem:
    """Map a Document ORM row to SearchResultItem."""
    return SearchResultItem(
        id=row.id,
        kind="document",
        title=row.title,
        owner_id=getattr(row, "owner_id", None),
        workspace_id=getattr(row, "workspace_id", None),
        file_type=None,          # Document has no file_type column — see module docstring
        modified_at=getattr(row, "updated_at", None) or getattr(row, "created_at", None),
    )


def _folder_item(row: Any) -> SearchResultItem:
    """Map a Folder ORM row to SearchResultItem."""
    return SearchResultItem(
        id=row.id,
        kind="folder",
        title=row.name,
        owner_id=None,           # Folder has no owner_id column
        workspace_id=getattr(row, "workspace_id", None),
        file_type=None,
        modified_at=getattr(row, "updated_at", None) or getattr(row, "created_at", None),
    )


def _user_item(row: Any) -> SearchResultItem:
    """Map a User ORM row to SearchResultItem."""
    display = getattr(row, "full_name", None) or getattr(row, "email", str(row.id))
    return SearchResultItem(
        id=row.id,
        kind="user",
        title=display,
        owner_id=None,
        workspace_id=None,
        file_type=None,
        modified_at=None,
    )


# ---------------------------------------------------------------------------
# search_documents
# ---------------------------------------------------------------------------


async def search_documents(
    db: AsyncSession,
    user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    file_type: Optional[str] = None,      # accepted for API compat; ignored — no column
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 20,
    offset: int = 0,
) -> SearchResultResponse:
    """
    Permission-aware document search.

    Security guarantee: only documents where the requesting user_id has an
    existing Permission row are ever included.  The check is a correlated
    EXISTS subquery so the database enforces the boundary, not Python code.

    Args:
        db:           Async session.
        user_id:      UUID of the requesting user — MUST be validated upstream.
        query:        Partial-match search string (ILIKE).
        workspace_id: Optional workspace filter.
        file_type:    Accepted but ignored — Document has no file_type column.
        date_from:    Lower bound on Document.created_at (inclusive).
        date_to:      Upper bound on Document.created_at (inclusive).
        limit:        Page size (max 100, enforced by route).
        offset:       Row offset.

    Returns:
        SearchResultResponse with items, total, and echo of query/limit/offset.
    """
    # Resolve Document via SQLAlchemy's class registry (works with both real
    # and stub models — no direct `from models.document import Document` needed).
    Document = _resolve_class("Document")

    # Correlated EXISTS: only rows where this user has a permission record.
    # Both columns are native UUID(as_uuid=True) on PostgreSQL — plain equality
    # is index-friendly and correct.  The test stubs mirror this type exactly.
    perm_exists = (
        select(Permission.id)
        .where(
            Permission.document_id == Document.id,
            Permission.user_id == user_id,
        )
        .correlate(Document)
        .exists()
    )

    base_q = select(Document).where(
        func.lower(Document.title).contains(func.lower(query)),
        perm_exists,
    )

    # Optional filters
    if workspace_id is not None:
        base_q = base_q.where(Document.workspace_id == workspace_id)
    if date_from is not None:
        base_q = base_q.where(Document.created_at >= date_from)
    if date_to is not None:
        base_q = base_q.where(Document.created_at <= date_to)

    # file_type filter intentionally omitted — Document has no file_type column.
    # Revisit once Zainab's team adds Document.file_type.

    # Count total (same filters, no pagination)
    count_q = select(func.count()).select_from(base_q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    # Paginated fetch ordered newest first
    rows_result = await db.execute(
        base_q.order_by(Document.created_at.desc()).limit(limit).offset(offset)
    )
    rows = rows_result.scalars().all()

    return SearchResultResponse(
        query=query,
        total=total,
        limit=limit,
        offset=offset,
        items=[_document_item(r) for r in rows],
    )


# ---------------------------------------------------------------------------
# search_folders
# ---------------------------------------------------------------------------


async def search_folders(
    db: AsyncSession,
    user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    limit: int = 20,
    offset: int = 0,
) -> SearchResultResponse:
    """
    Folder name search, optionally scoped to a workspace.

    OPEN QUESTION: Folder has no Permission relationship (confirmed on
    feature/documents-editor-files).  Until a WorkspaceMember model or a
    folder-level permission table is available, this function returns all
    name-matching folders (filtered by workspace_id if supplied).  There is
    currently no fine-grained folder access control — raise with the team
    before shipping to production if that is a concern.

    Args:
        db:           Async session.
        user_id:      UUID of the requesting user (retained for future use).
        query:        Partial-match search string against Folder.name.
        workspace_id: Optional workspace filter.
        limit, offset: Pagination.

    Returns:
        SearchResultResponse with matching Folder rows.
    """
    Folder = _resolve_class("Folder")

    base_q = select(Folder).where(
        func.lower(Folder.name).contains(func.lower(query)),
    )
    if workspace_id is not None:
        base_q = base_q.where(Folder.workspace_id == workspace_id)

    count_q = select(func.count()).select_from(base_q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    rows_result = await db.execute(
        base_q.order_by(Folder.created_at.desc()).limit(limit).offset(offset)
    )
    rows = rows_result.scalars().all()

    return SearchResultResponse(
        query=query,
        total=total,
        limit=limit,
        offset=offset,
        items=[_folder_item(r) for r in rows],
    )


# ---------------------------------------------------------------------------
# search_users
# ---------------------------------------------------------------------------


async def search_users(
    db: AsyncSession,
    query: str,
    limit: int = 20,
    offset: int = 0,
) -> SearchResultResponse:
    """
    Broad user lookup for the share-dialog people-picker.

    INTENTIONALLY NOT PERMISSION-GATED: a user sharing a document must be able
    to search for any registered user by name or email — gating this on workspace
    membership or document permissions would break the share workflow.  This
    assumption matches standard product behaviour (Google Docs, Notion, etc.).
    If the spec is ever narrowed to workspace-member-only, add a WorkspaceMember
    JOIN here and accept a workspace_id parameter.

    Searches: User.full_name OR User.email (ILIKE on both, OR-joined).

    Args:
        db:           Async session.
        query:        Partial-match against full_name / email.
        limit, offset: Pagination.

    Returns:
        SearchResultResponse with matching User rows.
    """
    User = _resolve_class("User")

    from sqlalchemy import or_

    name_col = getattr(User, "full_name", None)
    email_col = getattr(User, "email", None)

    conditions = []
    if name_col is not None:
        conditions.append(func.lower(name_col).contains(func.lower(query)))
    if email_col is not None:
        conditions.append(func.lower(email_col).contains(func.lower(query)))

    if not conditions:
        # Fallback if stub model has neither column — empty result
        return SearchResultResponse(
            query=query, total=0, limit=limit, offset=offset, items=[]
        )

    base_q = select(User).where(or_(*conditions))

    count_q = select(func.count()).select_from(base_q.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar_one()

    rows_result = await db.execute(base_q.limit(limit).offset(offset))
    rows = rows_result.scalars().all()

    return SearchResultResponse(
        query=query,
        total=total,
        limit=limit,
        offset=offset,
        items=[_user_item(r) for r in rows],
    )


# ---------------------------------------------------------------------------
# search_all  (global search — combines all three)
# ---------------------------------------------------------------------------


async def search_all(
    db: AsyncSession,
    user_id: uuid.UUID,
    query: str,
    workspace_id: Optional[uuid.UUID] = None,
    file_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    limit: int = 20,
    offset: int = 0,
) -> SearchResultResponse:
    """
    Combined global search across documents, folders, and users.

    Splits the limit evenly across the three resource types
    (limit // 3 each, at least 1).  The outer total is the sum of the
    three individual counts.  Items are ordered within each type by
    created_at DESC; no cross-type ranking is applied.

    Args:
        db:           Async session.
        user_id:      UUID of the requesting user.
        query:        Search string.
        workspace_id, file_type, date_from, date_to: forwarded to sub-searches.
        limit, offset: Passed through; per-type cap = max(1, limit // 3).

    Returns:
        SearchResultResponse where items is a merged list:
        [documents...] + [folders...] + [users...].
    """
    per_type_limit = max(1, limit // 3)

    doc_result = await search_documents(
        db, user_id, query,
        workspace_id=workspace_id, file_type=file_type,
        date_from=date_from, date_to=date_to,
        limit=per_type_limit, offset=offset,
    )
    folder_result = await search_folders(
        db, user_id, query,
        workspace_id=workspace_id,
        limit=per_type_limit, offset=offset,
    )
    user_result = await search_users(
        db, query,
        limit=per_type_limit, offset=offset,
    )

    merged_items = doc_result.items + folder_result.items + user_result.items
    merged_total = doc_result.total + folder_result.total + user_result.total

    return SearchResultResponse(
        query=query,
        total=merged_total,
        limit=limit,
        offset=offset,
        items=merged_items,
    )


# ---------------------------------------------------------------------------
# SQLAlchemy class-registry resolver
# ---------------------------------------------------------------------------


def _resolve_class(name: str):
    """
    Look up a mapped class by string name from SQLAlchemy's registry.

    This avoids a direct `from models.X import X` import, which would fail
    on this branch where Document/Folder/User do not exist as importable files.
    In test environments, stub classes registered against Base work identically.

    Raises:
        NameError: if the class is not registered (i.e., the real model file or
                   the test stub has not been imported yet).
    """
    from database.base import Base

    mapper_reg = Base.registry
    for mapper in mapper_reg.mappers:
        if mapper.class_.__name__ == name:
            return mapper.class_
    raise NameError(
        f"SQLAlchemy class {name!r} is not registered.  "
        f"Either import the real model file or register a stub before calling "
        f"search_service functions."
    )
