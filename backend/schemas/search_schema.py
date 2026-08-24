"""
Pydantic schemas for the Global Search API.

These cover query params and response shapes for the search endpoints.

DESIGN NOTE:
  SearchResultItem fields (title, owner_name, modified_at, etc.) are kept
  intentionally generic because the exact column names for Document, Folder,
  and User live on teammates' branches.  Fields marked with # TODO are
  placeholders — update them once Document/Folder/User models are merged.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


ResourceKind = Literal["document", "folder", "user"]


# ---------------------------------------------------------------------------
# Query parameters
# Consumed by the route via FastAPI Depends / Query(...)
# ---------------------------------------------------------------------------


class SearchQueryParams(BaseModel):
    """
    Validated representation of the GET /api/search query string.

    Not used directly as a FastAPI body — values are injected via
    individual Query() parameters in the route and assembled here for
    controller / service calls.
    """

    query: str = Field(..., min_length=1, max_length=500, description="Full-text search query.")

    # Optional filters
    workspace_id: Optional[uuid.UUID] = Field(
        None,
        description="Restrict results to a specific workspace UUID.",
    )
    file_type: Optional[str] = Field(
        None,
        description="Filter by file extension or MIME type (e.g. 'pdf', 'docx').",
        max_length=50,
    )
    resource_kind: Optional[ResourceKind] = Field(
        None,
        description="Limit results to one resource category: document | folder | user.",
    )
    # Date range — both optional; if only one is provided, the other end is open
    date_from: Optional[datetime] = Field(
        None, description="Include results created/modified on or after this date."
    )
    date_to: Optional[datetime] = Field(
        None, description="Include results created/modified on or before this date."
    )

    # Pagination
    limit: int = Field(20, ge=1, le=100, description="Page size (max 100).")
    offset: int = Field(0, ge=0, description="Row offset for pagination.")


# ---------------------------------------------------------------------------
# Individual result item
# ---------------------------------------------------------------------------


class SearchResultItem(BaseModel):
    """
    Generic search result shape covering documents, folders, and users.

    TODO: once Document, Folder, User models are merged, specialise this into
    DocumentResult / FolderResult / UserResult sub-schemas and use a
    discriminated union here.  For now a flexible Dict carries extra fields.
    """

    id: uuid.UUID
    kind: ResourceKind                  # "document" | "folder" | "user"
    title: str                          # document title / folder name / user display name
    # TODO: owner_name — depends on User.display_name field (not yet on this branch)
    owner_id: Optional[uuid.UUID] = None
    # TODO: workspace_name — depends on Workspace.name (not yet on this branch)
    workspace_id: Optional[uuid.UUID] = None
    file_type: Optional[str] = None     # document-only; None for folders/users
    # TODO: modified_at — depends on Document.updated_at (not yet on this branch)
    modified_at: Optional[datetime] = None
    # Catch-all for extra fields once specific models are available
    extra: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Paginated search response
# ---------------------------------------------------------------------------


class SearchResultResponse(BaseModel):
    """
    Paginated list of search results returned by GET /api/search*.

    query:   the original search string (echo for client debugging).
    total:   total matching rows across all pages.
    limit:   page size applied.
    offset:  offset applied.
    items:   current page of results.
    """

    query: str
    total: int
    limit: int
    offset: int
    items: List[SearchResultItem]
