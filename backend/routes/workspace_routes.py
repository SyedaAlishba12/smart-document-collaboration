import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.workspace_schema import (
    WorkspaceCreateRequest, WorkspaceUpdateRequest, WorkspaceEnvelope,
    WorkspaceMemberAddRequest, WorkspaceMemberEnvelope, MessageEnvelope,
)
from controllers import workspace_controller

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


def ok(message: str, data):
    return {"success": True, "message": message, "data": data}


@router.post("", response_model=WorkspaceEnvelope, status_code=201)
async def create_workspace(data: WorkspaceCreateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspace created successfully", await workspace_controller.create_workspace(db, user.id, data))


@router.get("", response_model=WorkspaceEnvelope)
async def list_my_workspaces(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspaces retrieved successfully", await workspace_controller.list_my_workspaces(db, user.id))


@router.get("/{workspace_id}", response_model=WorkspaceEnvelope)
async def get_workspace(workspace_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspace retrieved successfully", await workspace_controller.get_workspace(db, workspace_id, user.id))


@router.put("/{workspace_id}", response_model=WorkspaceEnvelope)
async def update_workspace(workspace_id: uuid.UUID, data: WorkspaceUpdateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspace updated successfully", await workspace_controller.update_workspace(db, workspace_id, user.id, data))


@router.get("/{workspace_id}/settings", response_model=WorkspaceEnvelope)
async def get_workspace_settings(workspace_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspace settings retrieved successfully", await workspace_controller.get_workspace(db, workspace_id, user.id))


@router.put("/{workspace_id}/settings", response_model=WorkspaceEnvelope)
async def update_workspace_settings(workspace_id: uuid.UUID, data: WorkspaceUpdateRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspace settings updated successfully", await workspace_controller.update_workspace(db, workspace_id, user.id, data))


@router.delete("/{workspace_id}", response_model=MessageEnvelope)
async def delete_workspace(workspace_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await workspace_controller.delete_workspace(db, workspace_id, user.id)
    return ok("Workspace deleted successfully", None)


@router.get("/{workspace_id}/members", response_model=WorkspaceMemberEnvelope)
async def list_members(workspace_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Workspace members retrieved successfully", await workspace_controller.list_members(db, workspace_id, user.id))


@router.post("/{workspace_id}/members", response_model=WorkspaceMemberEnvelope, status_code=201)
async def add_member(workspace_id: uuid.UUID, data: WorkspaceMemberAddRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return ok("Member added successfully", await workspace_controller.add_member(db, workspace_id, user.id, data))


@router.delete("/{workspace_id}/members/{user_id}", response_model=MessageEnvelope)
async def remove_member(workspace_id: uuid.UUID, user_id: uuid.UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await workspace_controller.remove_member(db, workspace_id, user.id, user_id)
    return ok("Member removed successfully", None)
