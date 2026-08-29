"""
Permission service — real async SQLAlchemy 2.0 implementations.

All functions are async-only (team rule: no sync SQLAlchemy anywhere).

Design notes
------------
- resource_type + resource_id together identified the protected object in the
  original scaffold.  The Permission model was later narrowed to document-only
  (SCOPE DECISION 2026-08-27): ResourceType enum removed from the model,
  resource_type/resource_id columns replaced with a concrete document_id FK.

  The resource_type *parameter* is kept in every public signature so callers
  on feature/permissions-search-notifications do not need a coordinated
  refactor right now.  Internally:
    • boolean checks (can_*): if resource_type != "document" return False.
    • mutations (grant_permission / revoke_permission): if resource_type !=
      "document" raise ValueError with a descriptive message.

- can_share() maps to permission_level in {editor, owner}.
  ASSUMED DEFAULT — product spec is ambiguous on whether editors can re-share.
  Using editor-or-above to unblock development; flag for product review.

- grant_permission() upserts: updates the level if a row already exists for
  (user_id, document_id), inserts a new row otherwise.

- revoke_permission() raises LookupError if the row is not found.
"""

import uuid
from typing import Literal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.permission import Permission, PermissionLevel, SharingScope

# Kept as a plain string type alias; the ResourceType enum was removed from
# models/permission.py (SCOPE DECISION 2026-08-27, document-only).  Callers
# that still reference ResourceType can switch to this Literal alias.
ResourceType = Literal["document", "folder"]

_UNSUPPORTED_RESOURCE_TYPE_MSG = (
    "Permission model is document-only. resource_type={!r} is not supported. "
    "Only 'document' is a valid resource_type for permission operations."
)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _fetch_permission(
    db: AsyncSession,
    user_id: uuid.UUID,
    document_id: uuid.UUID,
) -> Permission | None:
    """
    Return the single Permission row for (user_id, document_id), or None.

    Uses a plain SELECT with LIMIT 1 — no lazy loading, safe for async.
    """
    result = await db.execute(
        select(Permission)
        .where(
            Permission.user_id == user_id,
            Permission.document_id == document_id,
        )
        .limit(1)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Capability checks
# ---------------------------------------------------------------------------


async def can_view(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may read the resource.

    Applies when: permission_level in {viewer, commenter, editor, owner}
    — i.e., any Permission row for this (user_id, document_id) pair grants view.

    Args:
        db:            Async DB session (injected via FastAPI Depends).
        user_id:       UUID of the requesting user.
        resource_type: Must be "document"; any other value returns False.
        resource_id:   UUID of the document to check.

    Returns:
        True if the user has at least view access, False otherwise.
    """
    if resource_type != "document":
        return False
    row = await _fetch_permission(db, user_id, resource_id)
    return row is not None


async def can_comment(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may add comments to the resource.

    Applies when: permission_level in {commenter, editor, owner}.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: Must be "document"; any other value returns False.
        resource_id:   UUID of the document to check.

    Returns:
        True if the user has at least commenter access.
    """
    if resource_type != "document":
        return False
    row = await _fetch_permission(db, user_id, resource_id)
    if row is None:
        return False
    return row.permission_level in (
        PermissionLevel.commenter,
        PermissionLevel.editor,
        PermissionLevel.owner,
    )


async def can_edit(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may modify the resource content.

    Applies when: permission_level in {editor, owner}.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: Must be "document"; any other value returns False.
        resource_id:   UUID of the document to check.

    Returns:
        True if the user has at least editor access.
    """
    if resource_type != "document":
        return False
    row = await _fetch_permission(db, user_id, resource_id)
    if row is None:
        return False
    return row.permission_level in (
        PermissionLevel.editor,
        PermissionLevel.owner,
    )


async def can_share(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may share or change sharing settings for the resource.

    ASSUMED DEFAULT: permission_level in {editor, owner} can share.
    Product spec is ambiguous on whether editors can re-share — using
    editor-or-above to unblock development.  Flag for product review.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: Must be "document"; any other value returns False.
        resource_id:   UUID of the document to check.

    Returns:
        True if the user may manage sharing for this resource.
    """
    if resource_type != "document":
        return False
    row = await _fetch_permission(db, user_id, resource_id)
    if row is None:
        return False
    return row.permission_level in (
        PermissionLevel.editor,
        PermissionLevel.owner,
    )


async def can_delete(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may permanently delete the resource.

    Applies when: permission_level == owner only.
    Editors can trash but permanent deletion is owner-only.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: Must be "document"; any other value returns False.
        resource_id:   UUID of the document to check.

    Returns:
        True if the user has deletion rights on this resource.
    """
    if resource_type != "document":
        return False
    row = await _fetch_permission(db, user_id, resource_id)
    if row is None:
        return False
    return row.permission_level == PermissionLevel.owner


async def can_restore_version(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """
    Return True if the user may restore a previous version of the resource.

    Applies when: permission_level in {editor, owner}.
    Commenters and viewers cannot overwrite document content via a restore.

    Args:
        db:            Async DB session.
        user_id:       UUID of the requesting user.
        resource_type: Must be "document"; any other value returns False.
        resource_id:   UUID of the document to check.

    Returns:
        True if the user may restore a historical version.
    """
    if resource_type != "document":
        return False
    row = await _fetch_permission(db, user_id, resource_id)
    if row is None:
        return False
    return row.permission_level in (
        PermissionLevel.editor,
        PermissionLevel.owner,
    )


# ---------------------------------------------------------------------------
# Mutations
# ---------------------------------------------------------------------------


async def grant_permission(
    db: AsyncSession,
    resource_type: str,
    resource_id: uuid.UUID,
    user_id: uuid.UUID,
    level: PermissionLevel,
    granted_by: uuid.UUID,
) -> Permission:
    """
    Create (or upsert) a permission grant and return the persisted row.

    Upsert behaviour: if a Permission row already exists for
    (user_id, document_id), its permission_level is updated in-place and the
    same row is returned.  Otherwise a new row is inserted.

    Args:
        db:            Async DB session.
        resource_type: Must be "document"; raises ValueError otherwise.
        resource_id:   UUID of the document to protect.
        user_id:       UUID of the user receiving the grant.
        level:         PermissionLevel to assign.
        granted_by:    UUID of the user issuing the grant.

    Returns:
        The newly created or updated Permission ORM instance.

    Raises:
        ValueError: if resource_type is not "document".
    """
    if resource_type != "document":
        raise ValueError(_UNSUPPORTED_RESOURCE_TYPE_MSG.format(resource_type))

    existing = await _fetch_permission(db, user_id, resource_id)
    if existing is not None:
        # Upsert path: update the level on the existing row.
        existing.permission_level = level
        await db.flush()
        await db.refresh(existing)
        return existing

    new_perm = Permission(
        document_id=resource_id,
        user_id=user_id,
        permission_level=level,
        granted_by=granted_by,
        sharing_scope=SharingScope.private,
    )
    db.add(new_perm)
    await db.flush()
    await db.refresh(new_perm)
    return new_perm


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
    result = await db.execute(
        select(Permission).where(Permission.id == permission_id).limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise LookupError(
            f"Permission {permission_id!r} not found — nothing to revoke."
        )
    await db.delete(row)
    await db.flush()
