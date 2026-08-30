"""
Password hashing + JWT helpers shared across auth_service, user_service,
and the auth middleware. Owned by Fatima as part of the auth module.

Uses bcrypt directly instead of passlib, since passlib's bcrypt backend
detection is broken against bcrypt>=4.0 (AttributeError: module 'bcrypt'
has no attribute '__about__').
"""
import os
import bcrypt
from datetime import datetime, timedelta, timezone
from uuid import UUID

from jose import jwt, JWTError

SECRET_KEY = os.getenv("SECRET_KEY")  # Make sure this is set in .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
RESET_TOKEN_EXPIRE_MINUTES = 30
VERIFY_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    # bcrypt has a hard 72-byte limit on the input password.
    password_bytes = password.encode("utf-8")[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))


def _create_token(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(user_id: UUID) -> str:
    return _create_token(
        {"sub": str(user_id), "type": "access"},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: UUID) -> str:
    return _create_token(
        {"sub": str(user_id), "type": "refresh"},
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )


def create_reset_token(user_id: UUID) -> str:
    return _create_token(
        {"sub": str(user_id), "type": "reset"},
        timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    )


def create_verify_token(user_id: UUID) -> str:
    return _create_token(
        {"sub": str(user_id), "type": "verify"},
        timedelta(hours=VERIFY_TOKEN_EXPIRE_HOURS),
    )


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None