from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from controllers.folder_controller import FolderController
from schemas.folder_schema import (
    FolderCreate,
    FolderUpdate,
    FolderMove
)


router = APIRouter(
    prefix="/api/folders",
    tags=["Folders"]
)


@router.get("/workspace/{workspace_id}")
async def get_workspace_folders(
    workspace_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    return await FolderController.get_workspace_folders(
        db,
        workspace_id
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
async def create_folder(
    folder_data: FolderCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await FolderController.create_folder(
        db,
        folder_data
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result


@router.get("/{folder_id}")
async def get_folder(
    folder_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await FolderController.get_folder(
        db,
        folder_id
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result


@router.put("/{folder_id}")
async def update_folder(
    folder_id: UUID,
    folder_data: FolderUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await FolderController.update_folder(
        db,
        folder_id,
        folder_data
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result


@router.post("/{folder_id}/move")
async def move_folder(
    folder_id: UUID,
    move_data: FolderMove,
    db: AsyncSession = Depends(get_db)
):
    result = await FolderController.move_folder(
        db,
        folder_id,
        move_data
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result


@router.delete(
    "/{folder_id}",
    status_code=status.HTTP_200_OK
)
async def delete_folder(
    folder_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await FolderController.delete_folder(
        db,
        folder_id
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result