from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from services.team_service import TeamService
from schemas.team_schema import TeamCreate, TeamUpdate, TeamMemberAdd

class TeamController:
    @staticmethod
    async def create_team(db: AsyncSession, team_data: TeamCreate):
        # Create team via service layer
        team = await TeamService.create_team(db, team_data)
        
        # Explicitly commit changes to persist in database
        await db.commit()
        await db.refresh(team)
        
        return {
            "success": True,
            "message": "Team created successfully",
            "data": team
        }

    @staticmethod
    async def get_team(db: AsyncSession, team_id: UUID):
        team = await TeamService.get_team_by_id(db, team_id)
        if not team:
            return {
                "success": False,
                "message": "Team not found",
                "data": None
            }
        return {
            "success": True,
            "message": "Team fetched successfully",
            "data": team
        }

    @staticmethod
    async def update_team(db: AsyncSession, team_id: UUID, team_data: TeamUpdate):
        team = await TeamService.update_team(db, team_id, team_data)
        if not team:
            return {
                "success": False,
                "message": "Team not found",
                "data": None
            }
            
        # Commit updates to database
        await db.commit()
        await db.refresh(team)
        
        return {
            "success": True,
            "message": "Team updated successfully",
            "data": team
        }

    @staticmethod
    async def delete_team(db: AsyncSession, team_id: UUID):
        success = await TeamService.delete_team(db, team_id)
        if not success:
            return {
                "success": False,
                "message": "Team not found",
                "data": None
            }
            
        # Commit deletion to database
        await db.commit()
        
        return {
            "success": True,
            "message": "Team deleted successfully",
            "data": None
        }

    @staticmethod
    async def add_team_member(db: AsyncSession, team_id: UUID, member_data: TeamMemberAdd):
        member = await TeamService.add_team_member(db, team_id, member_data)
        
        # Check if service returned a validation error/duplicate message
        if isinstance(member, dict) and member.get("success") is False:
            return member
            
        # Commit new member addition to database
        await db.commit()
        if hasattr(member, "id"):
            await db.refresh(member)
            
        return {
            "success": True,
            "message": "Team member added successfully",
            "data": member
        }

    @staticmethod
    async def remove_team_member(db: AsyncSession, team_id: UUID, user_id: UUID):
        success = await TeamService.remove_team_member(db, team_id, user_id)
        if not success:
            return {
                "success": False,
                "message": "Team member not found",
                "data": None
            }
            
        # Commit removal to database
        await db.commit()
        
        return {
            "success": True,
            "message": "Team member removed successfully",
            "data": None
        }