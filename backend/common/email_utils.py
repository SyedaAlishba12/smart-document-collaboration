"""
Shared email-sending utility, built on Resend. Any module that needs to
send an email (verification, password reset, invites, notifications,
etc.) should import send_email from here rather than calling the
Resend SDK directly, so we have one place to change providers later.
"""
import os
import resend
from dotenv import load_dotenv

# Load .env here directly, rather than relying on main.py having already
# called load_dotenv() by the time this module is imported. Import order
# (routes -> controllers -> services -> this file) can run before
# main.py's own load_dotenv() line executes, which left RESEND_API_KEY
# reading as None even when it was correctly set in .env.
load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_email(to: str, subject: str, html: str) -> None:
    """
    Sends an email via Resend. Raises if RESEND_API_KEY isn't set, so
    misconfiguration fails loudly in development rather than silently
    dropping emails.
    """
    if not resend.api_key:
        raise RuntimeError(
            "RESEND_API_KEY is not set. Add it to your .env to send real emails."
        )

    resend.Emails.send(
        {
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        }
    )


def send_verification_email(to: str, full_name: str, token: str) -> None:
    link = f"{FRONTEND_URL}/verify_email?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2f6f68;">Verify your email</h2>
      <p>Hi {full_name},</p>
      <p>Thanks for signing up for StudioDocs. Please confirm your email address to activate your account.</p>
      <p style="margin: 24px 0;">
        <a href="{link}" style="background: #2f6f68; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
          Verify email
        </a>
      </p>
      <p style="color: #888; font-size: 12px;">If you didn't create this account, you can ignore this email.</p>
    </div>
    """
    send_email(to, "Verify your StudioDocs account", html)


def send_password_reset_email(to: str, full_name: str, token: str) -> None:
    link = f"{FRONTEND_URL}/reset_password?token={token}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #2f6f68;">Reset your password</h2>
      <p>Hi {full_name},</p>
      <p>We received a request to reset your password. This link expires in 30 minutes.</p>
      <p style="margin: 24px 0;">
        <a href="{link}" style="background: #2f6f68; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
          Reset password
        </a>
      </p>
      <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """
    send_email(to, "Reset your StudioDocs password", html)
