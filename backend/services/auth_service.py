import uuid
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User
from schemas.auth_schema import SignupRequest, LoginRequest
from common.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_reset_token,
    create_verify_token,
    decode_token,
)
from common.email_utils import send_verification_email, send_password_reset_email


async def signup_user(db: AsyncSession, data: SignupRequest) -> User:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")

    user = User(
        id=uuid.uuid4(),
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    verify_token = create_verify_token(user.id)
    try:
        send_verification_email(user.email, user.full_name, verify_token)
    except Exception as e:
        print(f"[EMAIL SEND FAILED] verification to {user.email}: {e}")

    return user


async def authenticate_user(db: AsyncSession, data: LoginRequest) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    return user


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


async def refresh_access_token(refresh_token: str) -> dict:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    user_id = uuid.UUID(payload["sub"])
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
    }


async def request_password_reset(db: AsyncSession, email: str) -> None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        # Do not reveal whether the email exists.
        return

    reset_token = create_reset_token(user.id)
    try:
        send_password_reset_email(user.email, user.full_name, reset_token)
    except Exception as e:
        # Don't let an email-provider failure (e.g. Resend's unverified-domain
        # recipient restriction) crash the whole request. Log it so it's
        # visible in the terminal, but still let the endpoint return
        # successfully -- the user experience for "email didn't arrive"
        # should be a quiet failure, not a 500.
        print(f"[EMAIL SEND FAILED] password reset to {user.email}: {e}")


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    user.password_hash = hash_password(new_password)
    await db.commit()


async def verify_email(db: AsyncSession, token: str) -> None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "verify":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired verification token")

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    user.is_verified = True
    await db.commit()
