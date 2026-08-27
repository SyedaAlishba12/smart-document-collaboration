from sqlalchemy.ext.asyncio import AsyncSession

from schemas.auth_schema import (
    SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    VerifyEmailRequest, RefreshTokenRequest, TokenResponse, SignupResponse, AuthUserResponse,
)
from services import auth_service


async def signup(db: AsyncSession, data: SignupRequest) -> SignupResponse:
    user = await auth_service.signup_user(db, data)
    return SignupResponse(user=AuthUserResponse.model_validate(user))


async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    user = await auth_service.authenticate_user(db, data)
    tokens = auth_service.issue_tokens(user)
    return TokenResponse(**tokens)


async def refresh(data: RefreshTokenRequest) -> TokenResponse:
    tokens = await auth_service.refresh_access_token(data.refresh_token)
    return TokenResponse(**tokens)


async def forgot_password(db: AsyncSession, data: ForgotPasswordRequest) -> dict:
    await auth_service.request_password_reset(db, data.email)
    return {"message": "If that email exists, a reset link has been sent."}


async def reset_password(db: AsyncSession, data: ResetPasswordRequest) -> dict:
    await auth_service.reset_password(db, data.token, data.new_password)
    return {"message": "Password reset successful."}


async def verify_email(db: AsyncSession, data: VerifyEmailRequest) -> dict:
    await auth_service.verify_email(db, data.token)
    return {"message": "Email verified successfully."}
