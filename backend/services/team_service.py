from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from models.team import Team
from models.team_member import TeamMember
from schemas.team_schema import TeamCreate, TeamUpdate, TeamMemberAdd

class TeamService:
    @staticmethod
    async def create_team(db: AsyncSession, team_data: TeamCreate) -> Team:
        new_team = Team(
            workspace_id=team_data.workspace_id,
            name=team_data.name,
            description=team_data.description
        )
        db.add(new_team)
        await db.commit()
        await db.refresh(new_team)
        return new_team

    @staticmethod
    async def get_team_by_id(db: AsyncSession, team_id: UUID) -> Team | None:
        result = await db.execute(select(Team).where(Team.id == team_id))
        return result.scalars().first()

    @staticmethod
    async def get_teams_by_workspace(db: AsyncSession, workspace_id: UUID) -> list[Team]:
        result = await db.execute(select(Team).where(Team.workspace_id == workspace_id))
        return result.scalars().all()

    @staticmethod
    async def update_team(db: AsyncSession, team_id: UUID, team_data: TeamUpdate) -> Team | None:
        team = await TeamService.get_team_by_id(db, team_id)
        if not team:
            return None
        
        if team_data.name is not None:
            team.name = team_data.name
        if team_data.description is not None:
            team.description = team_data.description

        await db.commit()
        await db.refresh(team)
        return team

    @staticmethod
    async def delete_team(db: AsyncSession, team_id: UUID) -> bool:
        team = await TeamService.get_team_by_id(db, team_id)
        if not team:
            return False
        
        await db.delete(team)
        await db.commit()
        return True

    @staticmethod
    async def add_team_member(db: AsyncSession, team_id: UUID, member_data: TeamMemberAdd) -> TeamMember:
        new_member = TeamMember(
            team_id=team_id,
            user_id=member_data.user_id,
            role=member_data.role
        )
        db.add(new_member)
        await db.commit()
        await db.refresh(new_member)
        return new_member

    @staticmethod
    async def remove_team_member(db: AsyncSession, team_id: UUID, user_id: UUID) -> bool:
        result = await db.execute(
            select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        )
        member = result.scalars().first()
        if not member:
            return False
        
        await db.delete(member)
        await db.commit()
        return True