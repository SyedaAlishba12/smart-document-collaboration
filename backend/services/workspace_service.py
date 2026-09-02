import uuid

from fastapi import HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.workspace import Workspace
from models.workspace_member import WorkspaceMember
from schemas.workspace_schema import (
    WorkspaceCreateRequest,
    WorkspaceUpdateRequest,
    WorkspaceMemberAddRequest,
    WorkspaceRole,
)


async def create_workspace(db: AsyncSession, owner_id: uuid.UUID, data: WorkspaceCreateRequest) -> Workspace:
    workspace = Workspace(
        id=uuid.uuid4(),
        owner_id=owner_id,
        name=data.name,
        description=data.description,
    )
    db.add(workspace)
    await db.flush()

    db.add(WorkspaceMember(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        user_id=owner_id,
        role=WorkspaceRole.owner.value,
    ))

    await db.commit()
    await db.refresh(workspace)
    return workspace


async def list_workspaces_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.name.asc())
    )
    return list(result.scalars().all())


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID | None = None) -> Workspace:
    if user_id is not None:
        await _require_membership(db, workspace_id, user_id)

    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Workspace not found")
    return workspace


async def _require_membership(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID) -> WorkspaceMember:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this workspace")
    return membership


async def update_workspace(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID, data: WorkspaceUpdateRequest
) -> Workspace:
    membership = await _require_membership(db, workspace_id, user_id)
    if membership.role not in (WorkspaceRole.owner.value, WorkspaceRole.admin.value):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only owner/admin can update workspace")

    workspace = await get_workspace(db, workspace_id)
    if data.name is not None:
        workspace.name = data.name
    if data.description is not None:
        workspace.description = data.description

    await db.commit()
    await db.refresh(workspace)
    return workspace


async def delete_workspace(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
    workspace = await get_workspace(db, workspace_id, user_id)
    if workspace.owner_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can delete this workspace")

    # The existing project schema does not define ON DELETE CASCADE from workspace
    # to every child table. Delete the workspace-owned hierarchy explicitly so a
    # valid workspace deletion cannot fail because of FK ordering. Files remain
    # because they are user-owned and are not directly owned by a workspace.
    await db.execute(text("DELETE FROM activity_log WHERE workspace_id = :workspace_id"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM workspace_member WHERE workspace_id = :workspace_id"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE workspace_id = :workspace_id)"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM teams WHERE workspace_id = :workspace_id"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM comment_replies WHERE comment_id IN (SELECT c.id FROM comments c JOIN documents d ON d.id = c.document_id WHERE d.workspace_id = :workspace_id)"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM comments WHERE document_id IN (SELECT id FROM documents WHERE workspace_id = :workspace_id)"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM document_versions WHERE document_id IN (SELECT id FROM documents WHERE workspace_id = :workspace_id)"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM permissions WHERE document_id IN (SELECT id FROM documents WHERE workspace_id = :workspace_id)"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM document_attachments WHERE document_id IN (SELECT id FROM documents WHERE workspace_id = :workspace_id)"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM documents WHERE workspace_id = :workspace_id"), {"workspace_id": workspace_id})
    await db.execute(text("UPDATE folders SET parent_folder_id = NULL WHERE workspace_id = :workspace_id"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM folders WHERE workspace_id = :workspace_id"), {"workspace_id": workspace_id})
    await db.execute(text("DELETE FROM workspace WHERE id = :workspace_id"), {"workspace_id": workspace_id})
    await db.commit()


async def list_members(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID) -> list[WorkspaceMember]:
    await _require_membership(db, workspace_id, user_id)
    result = await db.execute(
        select(WorkspaceMember)
        .options(selectinload(WorkspaceMember.user))
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.role.asc(), WorkspaceMember.joined_at.asc())
    )
    return list(result.scalars().all())


async def add_member(
    db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, data: WorkspaceMemberAddRequest
) -> WorkspaceMember:
    requester_membership = await _require_membership(db, workspace_id, requester_id)
    if requester_membership.role not in (WorkspaceRole.owner.value, WorkspaceRole.admin.value):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only owner/admin can add members")
    if data.role == WorkspaceRole.owner:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The workspace owner is assigned automatically")

    user_result = await db.execute(text('SELECT id FROM "user" WHERE id = :user_id'), {"user_id": data.user_id})
    if user_result.first() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    existing = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == data.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User is already a member")

    membership = WorkspaceMember(
        id=uuid.uuid4(),
        workspace_id=workspace_id,
        user_id=data.user_id,
        role=data.role.value,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    await db.refresh(membership, attribute_names=["user"])
    return membership


async def remove_member(db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, target_user_id: uuid.UUID) -> None:
    requester_membership = await _require_membership(db, workspace_id, requester_id)
    if requester_membership.role not in (WorkspaceRole.owner.value, WorkspaceRole.admin.value) and requester_id != target_user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed to remove this member")

    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == target_user_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Membership not found")
    if membership.role == WorkspaceRole.owner.value:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove the workspace owner")

    await db.delete(membership)
    await db.commit()
