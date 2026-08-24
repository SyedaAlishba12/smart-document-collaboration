"""
Permission service interface.

All functions are async-only (team rule: no sync SQLAlchemy anywhere).

Function bodies raise NotImplementedError; they are scaffolded here for
interface review.  Implementations land once:
  - The shared skeleton (User, Document, Folder) is merged to develop.
  - Alembic migrations for the permissions table have been applied.

Design notes
------------
- resource_type + resource_id together identify the protected object.
  Using two fields rather than a polymorphic FK avoids a sprawling union
  query and keeps the permission check callsite simple.
- can_share() maps to the "editor-or-above on a document shared externally"
  rule; exact logic TBD in implementation (pending final sharing spec).
- can_delete() and can_restore_version() are separate from can_edit() because
  product may decide only owners can delete permanently or restore old versions.
- grant_permission() returns the newly created Permission row so callers can
  include it in their API response envelope without a second DB round-trip.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from models.permission import Permission, PermissionLevel, ResourceType


# ---------------------------------------------------------------------------
# Capability checks
# ---------------------------------------------------------------------------


async def can_view(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may read the resource.

    Applies when: permission_level in {viewer, commenter, editor, owner}
    OR sharing_scope is workspace/anyone_with_link (public visibility rules
    TBD once sharing_scope semantics are finalised with the team).

    Args:
        db:            Async DB session (injected via FastAPI Depends).
        user_id:       UUID of the requesting user.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to check.

    Returns:
        True if the user has at least view access, False otherwise.
    """
    raise NotImplementedError


async def can_comment(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may add comments to the resource.

    Applies when: permission_level in {commenter, editor, owner}.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to check.

    Returns:
        True if the user has at least commenter access.
    """
    raise NotImplementedError


async def can_edit(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may modify the resource content.

    Applies when: permission_level in {editor, owner}.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to check.

    Returns:
        True if the user has at least editor access.
    """
    raise NotImplementedError


async def can_share(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may share or change sharing settings for the resource.

    OPEN QUESTION: product spec is ambiguous on whether editors can re-share.
    Default assumption: permission_level in {editor, owner} can share.
    Flag for product review before implementing.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to check.

    Returns:
        True if the user may manage sharing for this resource.
    """
    raise NotImplementedError


async def can_delete(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may permanently delete the resource.

    Applies when: permission_level == owner
    (Editors typically can trash but not permanently delete -- confirm with product.)

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to check.

    Returns:
        True if the user has deletion rights on this resource.
    """
    raise NotImplementedError


async def can_restore_version(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may restore a previous version of the resource.

    Applies when: permission_level in {editor, owner}
    (Commenters and viewers cannot overwrite document content via a restore.)

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to check.

    Returns:
        True if the user may restore a historical version.
    """
    raise NotImplementedError


# ---------------------------------------------------------------------------
# Mutations
# ---------------------------------------------------------------------------


async def grant_permission(
    db: AsyncSession,
    resource_type: ResourceType,
    resource_id: uuid.UUID,
    user_id: uuid.UUID,
    level: PermissionLevel,
    granted_by: uuid.UUID,
) -> Permission:
    """
    Create (or upsert) a permission grant and return the persisted row.

    OPEN QUESTION: upsert vs. error on duplicate (user_id, resource_id) pair?
    For now the implementation should upsert (update level if a grant already
    exists), but confirm with product whether grant history needs to be audited.

    Args:
        db:            Async DB session.
        resource_type: "document" | "folder".
        resource_id:   UUID of the resource to protect.
        user_id:       UUID of the user receiving the grant.
        level:         PermissionLevel to assign.
        granted_by:    UUID of the user issuing the grant.

    Returns:
        The newly created or updated Permission ORM instance.

    Raises:
        ValueError: if granted_by does not have can_share() rights (enforce in
                    the calling route handler, not here, to keep service pure).
    """
    raise NotImplementedError


async def revoke_permission(
    db: AsyncSession,
    permission_id: uuid.UUID,
) -> None:
    """
    Delete the permission row identified by permission_id.

    The caller (route handler) is responsible for verifying that the requesting
    user has can_share() rights on the associated resource before calling this.

    Args:
        db:            Async DB session.
        permission_id: UUID of the Permission row to delete.

    Raises:
        LookupError: if no Permission with permission_id exists.
    """
    raise NotImplementedError
