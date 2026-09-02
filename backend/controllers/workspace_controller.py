import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.workspace_schema import (
    WorkspaceCreateRequest, WorkspaceUpdateRequest, WorkspaceResponse,
    WorkspaceMemberAddRequest, WorkspaceMemberResponse,
)
from services import workspace_service


def workspace_data(workspace):
    return WorkspaceResponse.model_validate(workspace)


def member_data(member):
    return WorkspaceMemberResponse.model_validate(member)


async def create_workspace(db: AsyncSession, owner_id: uuid.UUID, data: WorkspaceCreateRequest):
    return workspace_data(await workspace_service.create_workspace(db, owner_id, data))


async def list_my_workspaces(db: AsyncSession, user_id: uuid.UUID):
    return [workspace_data(w) for w in await workspace_service.list_workspaces_for_user(db, user_id)]


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID):
    return workspace_data(await workspace_service.get_workspace(db, workspace_id, user_id))


async def update_workspace(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID, data: WorkspaceUpdateRequest):
    return workspace_data(await workspace_service.update_workspace(db, workspace_id, user_id, data))


async def delete_workspace(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID):
    await workspace_service.delete_workspace(db, workspace_id, user_id)


async def list_members(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID):
    return [member_data(m) for m in await workspace_service.list_members(db, workspace_id, user_id)]


async def add_member(db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, data: WorkspaceMemberAddRequest):
    return member_data(await workspace_service.add_member(db, workspace_id, requester_id, data))


async def remove_member(db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, target_user_id: uuid.UUID):
    await workspace_service.remove_member(db, workspace_id, requester_id, target_user_id)
