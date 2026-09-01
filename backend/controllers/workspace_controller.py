import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.workspace_schema import (
    WorkspaceCreateRequest, WorkspaceUpdateRequest, WorkspaceResponse,
    WorkspaceMemberAddRequest, WorkspaceMemberResponse,
)
from services import workspace_service


async def create_workspace(db: AsyncSession, owner_id: uuid.UUID, data: WorkspaceCreateRequest) -> WorkspaceResponse:
    workspace = await workspace_service.create_workspace(db, owner_id, data)
    return WorkspaceResponse.model_validate(workspace)


async def list_my_workspaces(db: AsyncSession, user_id: uuid.UUID) -> list[WorkspaceResponse]:
    workspaces = await workspace_service.list_workspaces_for_user(db, user_id)
    return [WorkspaceResponse.model_validate(w) for w in workspaces]


async def get_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> WorkspaceResponse:
    workspace = await workspace_service.get_workspace(db, workspace_id)
    return WorkspaceResponse.model_validate(workspace)


async def update_workspace(
    db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID, data: WorkspaceUpdateRequest
) -> WorkspaceResponse:
    workspace = await workspace_service.update_workspace(db, workspace_id, user_id, data)
    return WorkspaceResponse.model_validate(workspace)


async def delete_workspace(db: AsyncSession, workspace_id: uuid.UUID, user_id: uuid.UUID) -> dict:
    await workspace_service.delete_workspace(db, workspace_id, user_id)
    return {"message": "Workspace deleted."}


async def list_members(db: AsyncSession, workspace_id: uuid.UUID) -> list[WorkspaceMemberResponse]:
    members = await workspace_service.list_members(db, workspace_id)
    return [WorkspaceMemberResponse.model_validate(m) for m in members]


async def add_member(
    db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, data: WorkspaceMemberAddRequest
) -> WorkspaceMemberResponse:
    member = await workspace_service.add_member(db, workspace_id, requester_id, data)
    return WorkspaceMemberResponse.model_validate(member)


async def remove_member(db: AsyncSession, workspace_id: uuid.UUID, requester_id: uuid.UUID, target_user_id: uuid.UUID) -> dict:
    await workspace_service.remove_member(db, workspace_id, requester_id, target_user_id)
    return {"message": "Member removed."}
