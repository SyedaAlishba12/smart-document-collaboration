"""
Permission middleware — FastAPI dependency factories for route guards.

Usage in a route:
    from middleware.permission_middleware import require_can_view

    @router.get("/api/documents/{document_id}/content")
    async def get_content(
        document_id: uuid.UUID,
        _: None = Depends(require_can_view("document")),
        db: AsyncSession = Depends(get_db),
    ):
        ...

Architecture
------------
Each require_can_*() function is a *dependency factory* — it returns a
FastAPI Depends-compatible async callable that:
  1. Extracts the authenticated user_id from the request (via a shared
     auth dependency — TODO: wire to real JWT once auth is merged).
  2. Calls the relevant permission_service stub.
  3. Raises HTTP 403 if access is denied, HTTP 501 if the service is
     not yet implemented.

The factories accept a resource_type argument so one set of guards covers
both "document" and "folder" resources.

NOTE: All service functions currently raise NotImplementedError.
The middleware handles this by raising HTTP 501 with a clear message so
development of dependent routes can proceed without crashing.
"""

import uuid
from typing import Callable, Literal

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import AsyncSessionLocal
from services import permission_service

ResourceType = Literal["document", "folder"]


# ---------------------------------------------------------------------------
# Shared DB dependency
# ---------------------------------------------------------------------------

async def get_db() -> AsyncSession:
    """Yield an async DB session; close it after the request completes."""
    async with AsyncSessionLocal() as session:
        yield session


# ---------------------------------------------------------------------------
# Auth stub
# ---------------------------------------------------------------------------

async def get_current_user_id(request: Request) -> uuid.UUID:
    """
    Extract the authenticated user's UUID from the request.

    TODO: replace this stub with a real JWT/session verification dependency
    once the auth module is merged from the shared skeleton branch.

    For now returns a fixed sentinel UUID so routes can be tested manually
    without a real auth flow.
    """
    # STUB — replace with real token parsing:
    # token = request.headers.get("Authorization", "").removeprefix("Bearer ")
    # return jwt.decode(token, SECRET_KEY, ...)["sub"]
    return uuid.UUID("00000000-0000-0000-0000-000000000001")


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------

def require_can_view(resource_type: ResourceType) -> Callable:
    """
    Return a FastAPI dependency that checks can_view permission.

    The returned dependency reads `{resource_type}_id` from the path
    params (e.g. `document_id` for resource_type="document").
    """

    async def dependency(
        request: Request,
        current_user_id: uuid.UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        resource_id = _extract_resource_id(request, resource_type)
        try:
            allowed = await permission_service.can_view(
                db=db,
                user_id=current_user_id,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        except NotImplementedError:
            raise HTTPException(
                status_code=501,
                detail="Permission check not yet implemented — pending model merge.",
            )
        if not allowed:
            raise HTTPException(status_code=403, detail="View access denied.")

    return dependency


def require_can_edit(resource_type: ResourceType) -> Callable:
    """Return a FastAPI dependency that checks can_edit permission."""

    async def dependency(
        request: Request,
        current_user_id: uuid.UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        resource_id = _extract_resource_id(request, resource_type)
        try:
            allowed = await permission_service.can_edit(
                db=db,
                user_id=current_user_id,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        except NotImplementedError:
            raise HTTPException(
                status_code=501,
                detail="Permission check not yet implemented — pending model merge.",
            )
        if not allowed:
            raise HTTPException(status_code=403, detail="Edit access denied.")

    return dependency


def require_can_comment(resource_type: ResourceType) -> Callable:
    """Return a FastAPI dependency that checks can_comment permission."""

    async def dependency(
        request: Request,
        current_user_id: uuid.UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        resource_id = _extract_resource_id(request, resource_type)
        try:
            allowed = await permission_service.can_comment(
                db=db,
                user_id=current_user_id,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        except NotImplementedError:
            raise HTTPException(
                status_code=501,
                detail="Permission check not yet implemented — pending model merge.",
            )
        if not allowed:
            raise HTTPException(status_code=403, detail="Comment access denied.")

    return dependency


def require_can_share(resource_type: ResourceType) -> Callable:
    """Return a FastAPI dependency that checks can_share permission."""

    async def dependency(
        request: Request,
        current_user_id: uuid.UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        resource_id = _extract_resource_id(request, resource_type)
        try:
            allowed = await permission_service.can_share(
                db=db,
                user_id=current_user_id,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        except NotImplementedError:
            raise HTTPException(
                status_code=501,
                detail="Permission check not yet implemented — pending model merge.",
            )
        if not allowed:
            raise HTTPException(status_code=403, detail="Share access denied.")

    return dependency


def require_can_delete(resource_type: ResourceType) -> Callable:
    """Return a FastAPI dependency that checks can_delete permission."""

    async def dependency(
        request: Request,
        current_user_id: uuid.UUID = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> None:
        resource_id = _extract_resource_id(request, resource_type)
        try:
            allowed = await permission_service.can_delete(
                db=db,
                user_id=current_user_id,
                resource_type=resource_type,
                resource_id=resource_id,
            )
        except NotImplementedError:
            raise HTTPException(
                status_code=501,
                detail="Permission check not yet implemented — pending model merge.",
            )
        if not allowed:
            raise HTTPException(status_code=403, detail="Delete access denied.")

    return dependency


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _extract_resource_id(request: Request, resource_type: str) -> uuid.UUID:
    """
    Pull the resource UUID from the path params.

    Looks for `{resource_type}_id` first (e.g. `document_id`), then falls
    back to the generic `id` param.  Raises 422 if neither is present.
    """
    path_params = request.path_params
    key = f"{resource_type}_id"

    raw = path_params.get(key) or path_params.get("id")
    if raw is None:
        raise HTTPException(
            status_code=422,
            detail=f"Could not extract resource ID from path (expected '{key}' or 'id').",
        )
    try:
        return uuid.UUID(str(raw))
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Invalid UUID: {raw}")
