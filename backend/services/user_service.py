import uuid
from fastapi import HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.user_schema import UserUpdateRequest


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


async def update_user_profile(db: AsyncSession, user: User, data: UserUpdateRequest) -> User:
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    if data.status is not None:
        user.status = data.status

    await db.commit()
    await db.refresh(user)
    return user


async def search_users(db: AsyncSession, query: str, limit: int = 20) -> list[User]:
    pattern = f"%{query}%"
    result = await db.execute(
        select(User)
        .where(or_(User.full_name.ilike(pattern), User.email.ilike(pattern)))
        .limit(limit)
    )
    return result.scalars().all()
