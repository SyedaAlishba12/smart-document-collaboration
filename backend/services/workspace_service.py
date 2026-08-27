import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.workspace import Workspace
from models.workspace_member import WorkspaceMember
from schemas.workspace_schema import (
    WorkspaceCreateRequest,
    WorkspaceUpdateRequest,
    WorkspaceMemberAddRequest,
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

    # Owner is automatically a member with role "owner"
    membership = WorkspaceMember(
        id=uuid.uuid4(),
        workspace_id=workspace.id,
        user_id=owner_id,
        role="owner",
    )
    db.add(membership)

    await db.commit()
    await db.refresh(workspace)
    return workspace


async def list_workspaces_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
    )
    return result.scalars().all()


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> Workspace:
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
    if membership.role not in ("owner", "admin"):
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
    workspace = await get_workspace(db, workspace_id)
    if workspace.owner_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can delete this workspace")

    await db.delete(workspace)
    await db.commit()


async def list_members(db: AsyncSession, workspace_id: uuid.UUID) -> list[WorkspaceMember]:
    result = await db.execute(
        select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id)
    )
    return result.scalars().all()


async def add_member(
    db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, data: WorkspaceMemberAddRequest
) -> WorkspaceMember:
    requester_membership = await _require_membership(db, workspace_id, requester_id)
    if requester_membership.role not in ("owner", "admin"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only owner/admin can add members")

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
        role=data.role,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


async def remove_member(db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, target_user_id: uuid.UUID) -> None:
    requester_membership = await _require_membership(db, workspace_id, requester_id)
    if requester_membership.role not in ("owner", "admin") and requester_id != target_user_id:
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

    if membership.role == "owner":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove the workspace owner")

    await db.delete(membership)
    await db.commit()
