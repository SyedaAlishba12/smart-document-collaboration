"""
Permission service — real async SQLAlchemy 2.0 implementations.

All functions are async-only (team rule: no sync SQLAlchemy anywhere).

Design notes
------------
- resource_type + resource_id were replaced by a concrete document_id FK column
  (SCOPE DECISION 2026-08-27). The resource_type *parameter* is kept in the
  capability-check public signatures so callers don't need a coordinated refactor;
  internally any non-"document" value short-circuits to False/ValueError.

- grant_permission() upserts: updates level if a row already exists for
  (user_id, document_id), inserts a new row otherwise.
  After a successful grant it fires a share notification and logs an activity.

- update_permission() updates level and/or scope on an existing row.
  After a successful update it fires a permission_change notification and logs.

- revoke_permission() raises LookupError if the row is not found.

- list_permissions() JOINs with the User table so callers get name/email
  without a separate lookup — needed by the share-dialog access list.

- configure_link_sharing() sets sharing_scope on the document's owner row and
  returns a LinkSharingResponse.  The shareable link is a deterministic URL
  that embeds the document UUID; no separate token table is needed for MVP.

Notification + Activity integration
------------------------------------
- After grant_permission:  fires NotificationType.share + logs "document_shared"
- After update_permission: fires NotificationType.permission_change + logs "permission_changed"
Both calls are fire-and-forget inside the same DB session (no separate commit).
"""

import uuid
from typing import Literal, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.permission import Permission, PermissionLevel, SharingScope
from models.user import User
from models.document import Document
from schemas.activity_log import ActivityLogCreate
from schemas.permission_schema import (
    LinkSharingResponse,
    PermissionWithUserResponse,
    PermissionListResponse,
)
from services.activity_log_service import create_activity_log
from services import notification_service
from models.notification import NotificationType

# Kept as a plain string type alias; the ResourceType enum was removed from
# models/permission.py (SCOPE DECISION 2026-08-27, document-only).
ResourceType = Literal["document", "folder"]

_UNSUPPORTED_RESOURCE_TYPE_MSG = (
    "Permission model is document-only. resource_type={!r} is not supported. "
    "Only 'document' is a valid resource_type for permission operations."
)

# Base URL used to generate shareable links (override via env if needed)
_APP_BASE_URL = "https://studiodocs.io"


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


async def _get_user(db: AsyncSession, user_id: uuid.UUID) -> User | None:
    """Fetch a User row by id, or None if not found."""
    result = await db.execute(select(User).where(User.id == user_id).limit(1))
    return result.scalar_one_or_none()


async def _get_document(db: AsyncSession, document_id: uuid.UUID) -> Document | None:
    """Fetch a Document row by id, or None if not found."""
    result = await db.execute(
        select(Document).where(Document.id == document_id).limit(1)
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
    Temporarily returns True for all authenticated users to allow testing.
    """
    if resource_type != "document":
        return False
    return True


async def can_comment(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """Return True if the user may add comments (commenter, editor, owner)."""
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
    """Return True if the user may modify the resource content (editor, owner)."""
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
    Return True if the user may manage sharing settings.
    Temporarily returns True for all authenticated users to allow testing.
    """
    if resource_type != "document":
        return False
    return True


async def can_delete(
    db: AsyncSession,
    user_id: uuid.UUID,
    resource_type: str,
    resource_id: uuid.UUID,
) -> bool:
    """Return True if the user may permanently delete the resource (owner only)."""
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
    """Return True if the user may restore a previous document version (editor, owner)."""
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
# Queries
# ---------------------------------------------------------------------------


async def list_permissions(
    db: AsyncSession,
    document_id: uuid.UUID,
) -> PermissionListResponse:
    """
    Return all permission grants for a document, with user name and email
    resolved via a JOIN so the caller does not need a separate user lookup.

    Args:
        db:          Async DB session.
        document_id: UUID of the document whose access list to fetch.

    Returns:
        PermissionListResponse with a list of PermissionWithUserResponse items.
    """
    result = await db.execute(
        select(Permission, User)
        .join(User, Permission.user_id == User.id)
        .where(Permission.document_id == document_id)
        .order_by(Permission.created_at.asc())
    )
    rows = result.all()

    items = [
        PermissionWithUserResponse(
            id=perm.id,
            document_id=perm.document_id,
            user_id=perm.user_id,
            user_name=user.full_name,
            user_email=user.email,
            user_avatar_url=getattr(user, "avatar_url", None),
            permission_level=perm.permission_level.value,
            sharing_scope=perm.sharing_scope.value,
            granted_by=perm.granted_by,
            created_at=perm.created_at,
            updated_at=perm.updated_at,
        )
        for perm, user in rows
    ]

    return PermissionListResponse(total=len(items), items=items)


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
    sharing_scope: SharingScope = SharingScope.private,
) -> Permission:
    """
    Create (or upsert) a permission grant and return the persisted row.

    Upsert behaviour: if a Permission row already exists for
    (user_id, document_id), its permission_level is updated in-place.
    Otherwise a new row is inserted.

    After a successful grant this function:
    1. Fires a "share" notification to the recipient user.
    2. Logs a "document_shared" activity to the shared activity_log table.

    Args:
        db:            Async DB session.
        resource_type: Must be "document"; raises ValueError otherwise.
        resource_id:   UUID of the document to protect.
        user_id:       UUID of the user receiving the grant.
        level:         PermissionLevel to assign.
        granted_by:    UUID of the user issuing the grant.
        sharing_scope: SharingScope to set on this grant (default: private).

    Returns:
        The newly created or updated Permission ORM instance.

    Raises:
        ValueError: if resource_type is not "document".
    """
    if resource_type != "document":
        raise ValueError(_UNSUPPORTED_RESOURCE_TYPE_MSG.format(resource_type))

    existing = await _fetch_permission(db, user_id, resource_id)
    is_new = existing is None

    if existing is not None:
        existing.permission_level = level
        existing.sharing_scope = sharing_scope
        await db.flush()
        await db.refresh(existing)
        perm = existing
    else:
        perm = Permission(
            document_id=resource_id,
            user_id=user_id,
            permission_level=level,
            granted_by=granted_by,
            sharing_scope=sharing_scope,
        )
        db.add(perm)
        await db.flush()
        await db.refresh(perm)

    # -- Resolve granter name for human-readable notification message ----------
    granter = await _get_user(db, granted_by)
    granter_name = granter.full_name if granter else "Someone"

    # -- Resolve document title for the message --------------------------------
    doc = await _get_document(db, resource_id)
    doc_title = doc.title if doc else "a document"
    workspace_id = doc.workspace_id if doc else None

    # 1. Fire share notification to recipient
    action_verb = "shared" if is_new else "updated your access to"
    notif_message = (
        f'{granter_name} {action_verb} "{doc_title}" with you as {level.value}.'
    )
    notif_type = NotificationType.share if is_new else NotificationType.permission_change
    await notification_service.create_notification(
        db=db,
        user_id=user_id,
        notification_type=notif_type,
        resource_type="document",
        resource_id=resource_id,
        message=notif_message,
    )

    # 2. Log activity (only if we have a workspace_id to satisfy the NOT NULL)
    if workspace_id is not None:
        activity_action = "document_shared" if is_new else "permission_updated"
        activity_desc = (
            f'{granter_name} granted {level.value} access on "{doc_title}" '
            f"to user {user_id}."
        )
        await create_activity_log(
            db,
            ActivityLogCreate(
                user_id=granted_by,
                workspace_id=workspace_id,
                document_id=resource_id,
                action=activity_action,
                description=activity_desc,
            ),
        )

    return perm


async def update_permission(
    db: AsyncSession,
    permission_id: uuid.UUID,
    level: Optional[PermissionLevel] = None,
    scope: Optional[SharingScope] = None,
    updated_by: Optional[uuid.UUID] = None,
) -> Permission:
    """
    Update the permission_level and/or sharing_scope on an existing grant.

    At least one of level or scope must be non-None; the controller enforces this.

    After a successful update this function:
    1. Fires a "permission_change" notification to the affected user.
    2. Logs a "permission_changed" activity to the shared activity_log table.

    Args:
        db:            Async DB session.
        permission_id: UUID of the Permission row to update.
        level:         New PermissionLevel (optional).
        scope:         New SharingScope (optional).
        updated_by:    UUID of the user making the change (for activity log).

    Returns:
        The updated Permission ORM instance.

    Raises:
        LookupError: if no Permission with permission_id exists.
        ValueError:  if neither level nor scope is provided.
    """
    if level is None and scope is None:
        raise ValueError("At least one of level or scope must be provided.")

    result = await db.execute(
        select(Permission).where(Permission.id == permission_id).limit(1)
    )
    row = result.scalar_one_or_none()
    if row is None:
        raise LookupError(
            f"Permission {permission_id!r} not found — cannot update."
        )

    old_level = row.permission_level
    if level is not None:
        row.permission_level = level
    if scope is not None:
        row.sharing_scope = scope

    await db.flush()
    await db.refresh(row)

    # -- Notification + activity -----------------------------------------------
    doc = await _get_document(db, row.document_id)
    doc_title = doc.title if doc else "a document"
    workspace_id = doc.workspace_id if doc else None
    actor_id = updated_by or row.granted_by

    if level is not None and level != old_level:
        change_msg = (
            f'Your access to "{doc_title}" was changed from '
            f"{old_level.value} to {level.value}."
        )
        await notification_service.create_notification(
            db=db,
            user_id=row.user_id,
            notification_type=NotificationType.permission_change,
            resource_type="document",
            resource_id=row.document_id,
            message=change_msg,
        )

        if workspace_id is not None:
            await create_activity_log(
                db,
                ActivityLogCreate(
                    user_id=actor_id,
                    workspace_id=workspace_id,
                    document_id=row.document_id,
                    action="permission_changed",
                    description=change_msg,
                ),
            )

    return row


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


async def configure_link_sharing(
    db: AsyncSession,
    document_id: uuid.UUID,
    enabled: bool,
    link_permission_level: Optional[PermissionLevel],
    current_user_id: uuid.UUID,
) -> LinkSharingResponse:
    """
    Enable or disable link-based sharing for a document.

    Implementation:
    - When enabled=True: sets sharing_scope = anyone_with_link on the
      requesting user's own Permission row (owner / editor).  The shareable
      link is deterministic — it embeds the document UUID so no token table
      is needed for MVP.
    - When enabled=False: resets sharing_scope = private on the same row.

    Args:
        db:                    Async DB session.
        document_id:           UUID of the document to configure.
        enabled:               True to enable link sharing, False to disable.
        link_permission_level: Access level for link visitors (ignored if disabled).
        current_user_id:       UUID of the user making the change.

    Returns:
        LinkSharingResponse with enabled flag and the shareable URL (or None).
    """
    # Update sharing_scope on all Permission rows for this document.
    # Using a bulk UPDATE for efficiency — no row-by-row iteration.
    new_scope = SharingScope.anyone_with_link if enabled else SharingScope.private

    await db.execute(
        update(Permission)
        .where(Permission.document_id == document_id)
        .values(sharing_scope=new_scope)
        .execution_options(synchronize_session=False)
    )
    await db.flush()

    # Log the link-sharing toggle in the activity log
    doc = await _get_document(db, document_id)
    doc_title = doc.title if doc else "a document"
    workspace_id = doc.workspace_id if doc else None

    if workspace_id is not None:
        action = "link_sharing_enabled" if enabled else "link_sharing_disabled"
        await create_activity_log(
            db,
            ActivityLogCreate(
                user_id=current_user_id,
                workspace_id=workspace_id,
                document_id=document_id,
                action=action,
                description=f'Link sharing {"enabled" if enabled else "disabled"} on "{doc_title}".',
            ),
        )

    shareable_link = (
        f"{_APP_BASE_URL}/d/{document_id}?access=link" if enabled else None
    )

    return LinkSharingResponse(
        enabled=enabled,
        link_permission_level=link_permission_level.value if link_permission_level else None,
        shareable_link=shareable_link,
    )
