"""
Shared email-sending utility, built on Gmail SMTP (via an App Password)
instead of Resend, since Resend's free tier only allows sending to the
account owner's own email until a domain is verified -- not practical
for a team project with no budget for a domain.

Any module that needs to send an email (verification, password reset,
invites, notifications, etc.) should import send_email from here rather
than writing its own SMTP logic, so we have one place to change
providers later.
"""
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_email(to: str, subject: str, html: str) -> None:
    """
    Sends an email via Gmail SMTP. Raises if GMAIL_USER/GMAIL_APP_PASSWORD
    aren't set, so misconfiguration fails loudly in development rather
    than silently dropping emails.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise RuntimeError(
            "GMAIL_USER / GMAIL_APP_PASSWORD are not set. Add them to your .env to send real emails."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_USER, [to], msg.as_string())


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
