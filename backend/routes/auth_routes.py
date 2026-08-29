from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.auth_schema import (
    SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    VerifyEmailRequest, RefreshTokenRequest, TokenResponse, SignupResponse, AuthUserResponse,
)
from controllers import auth_controller

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.signup(db, data)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.login(db, data)


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    # Stateless JWT: logout is handled client-side by discarding tokens.
    # If a blacklist/refresh-token table gets added later, revoke here.
    return {"message": "Logged out."}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshTokenRequest):
    return await auth_controller.refresh(data)


@router.post("/forgot_password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.forgot_password(db, data)


@router.post("/reset_password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.reset_password(db, data)


@router.post("/verify_email")
async def verify_email(data: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    return await auth_controller.verify_email(db, data)


@router.get("/me", response_model=AuthUserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return AuthUserResponse.model_validate(user)