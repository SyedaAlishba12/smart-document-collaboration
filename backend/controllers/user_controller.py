import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.user_schema import UserResponse, UserUpdateRequest, UserSearchResult
from services import user_service


async def get_me(user: User) -> UserResponse:
    return UserResponse.model_validate(user)


async def update_me(db: AsyncSession, user: User, data: UserUpdateRequest) -> UserResponse:
    updated = await user_service.update_user_profile(db, user, data)
    return UserResponse.model_validate(updated)


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> UserResponse:
    user = await user_service.get_user_by_id(db, user_id)
    return UserResponse.model_validate(user)


async def search_users(db: AsyncSession, query: str) -> list[UserSearchResult]:
    users = await user_service.search_users(db, query)
    return [UserSearchResult.model_validate(u) for u in users]
