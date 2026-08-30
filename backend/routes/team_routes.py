from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from database.session import get_db
from controllers.team_controller import TeamController
from schemas.team_schema import TeamCreate, TeamUpdate, TeamMemberAdd

router = APIRouter(prefix="/api/teams", tags=["Teams"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_team(team_data: TeamCreate, db: AsyncSession = Depends(get_db)):
    result = await TeamController.create_team(db, team_data)
    return result

@router.get("/{team_id}")
async def get_team(team_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await TeamController.get_team(db, team_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.put("/{team_id}")
async def update_team(team_id: UUID, team_data: TeamUpdate, db: AsyncSession = Depends(get_db)):
    result = await TeamController.update_team(db, team_id, team_data)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.delete("/{team_id}", status_code=status.HTTP_200_OK)
async def delete_team(team_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await TeamController.delete_team(db, team_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
async def add_team_member(team_id: UUID, member_data: TeamMemberAdd, db: AsyncSession = Depends(get_db)):
    result = await TeamController.add_team_member(db, team_id, member_data)
    return result

@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_200_OK)
async def remove_team_member(team_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await TeamController.remove_team_member(db, team_id, user_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result