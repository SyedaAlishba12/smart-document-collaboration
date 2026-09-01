from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from database.session import get_db
from controllers.team_controller import TeamController
from services.team_service import TeamService
from schemas.team_schema import TeamCreate, TeamUpdate, TeamMemberAdd, TeamResponse

router = APIRouter(prefix="/api/teams", tags=["Teams"])

# 1. Create a new team endpoint
@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_team(team_data: TeamCreate, db: AsyncSession = Depends(get_db)):
    result = await TeamController.create_team(db, team_data)
    return result

# 2. Get all teams by workspace ID endpoint
@router.get("", response_model=dict)
@router.get("/", response_model=dict)
async def get_teams_by_workspace(workspace_id: UUID = Query(...), db: AsyncSession = Depends(get_db)):
    teams = await TeamService.get_teams_by_workspace(db, workspace_id)
    # Explicitly convert SQLAlchemy models to Pydantic response schemas
    teams_list = [TeamResponse.model_validate(t) for t in teams]
    return {
        "success": True,
        "message": "Teams fetched successfully",
        "data": teams_list
    }

# 3. Get single team details by ID endpoint
@router.get("/{team_id}")
async def get_team(team_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await TeamController.get_team(db, team_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

# 4. Update team details endpoint
@router.put("/{team_id}")
async def update_team(team_id: UUID, team_data: TeamUpdate, db: AsyncSession = Depends(get_db)):
    result = await TeamController.update_team(db, team_id, team_data)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

# 5. Delete an existing team endpoint
@router.delete("/{team_id}", status_code=status.HTTP_200_OK)
async def delete_team(team_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await TeamController.delete_team(db, team_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

# 6. Add a team member via email/payload endpoint
@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
async def add_team_member(team_id: UUID, member_data: TeamMemberAdd, db: AsyncSession = Depends(get_db)):
    result = await TeamController.add_team_member(db, team_id, member_data)
    
    # Handle logical failures or custom duplicate warnings returned by the controller
    if isinstance(result, dict) and result.get("success") == False:
        return result
        
    return result

# 7. Remove a member from a team endpoint
@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_200_OK)
async def remove_team_member(team_id: UUID, user_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await TeamController.remove_team_member(db, team_id, user_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result

# 8. Get raw list of all users endpoint
@router.get("/users/list")
async def get_users_list(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return {"success": True, "data": users}