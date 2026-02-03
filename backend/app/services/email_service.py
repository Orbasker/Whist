"""Email service for sending game invitations via Resend"""

import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via Resend API"""

    def __init__(self):
        self.api_key = settings.resend_email
        # Use Resend's default domain for development (no verification needed)
        # For production, verify your domain at https://resend.com/domains
        self.from_email = settings.from_email if settings.from_email else "onboarding@resend.dev"
        self.frontend_url = settings.effective_frontend_url
        self.api_url = "https://api.resend.com/emails"
        
        # Validate frontend URL configuration
        self._validate_frontend_url()
    
    def _validate_frontend_url(self):
        """Validate that frontend URL is correctly configured."""
        url = self.frontend_url.lower()
        
        # Check for common misconfigurations
        issues = []
        
        if settings.is_production:
            # In production, should use HTTPS
            if url.startswith("http://"):
                issues.append("FRONTEND_URL uses HTTP instead of HTTPS in production")
            
            # Should not point to API domain
            if ".api." in url or url.endswith(".api"):
                issues.append(f"FRONTEND_URL appears to point to API domain ({self.frontend_url}), should point to frontend domain")
            
            # Should not be localhost
            if "localhost" in url:
                issues.append("FRONTEND_URL points to localhost in production")
        
        if issues:
            logger.warning(
                f"Frontend URL configuration issues detected: {'; '.join(issues)}. "
                f"Current FRONTEND_URL: {self.frontend_url}. "
                f"Expected: https://whist.orbasker.com (production) or set FRONTEND_URL environment variable."
            )
        else:
            logger.info(f"Frontend URL configured: {self.frontend_url}")

    async def send_invitation(
        self,
        email: str,
        invitation_token: str,
        game_name: Optional[str] = None,
        inviter_name: Optional[str] = None,
    ) -> bool:
        """
        Send game invitation email via Resend.

        Args:
            email: Recipient email address
            invitation_token: JWT invitation token
            game_name: Optional game name
            inviter_name: Optional inviter name

        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.api_key:
            logger.error("Resend API key not configured (RESEND_EMAIL)")
            return False

        invitation_link = f"{self.frontend_url}/invite/{invitation_token}"
        logger.info(f"Generating invitation link: {invitation_link} (frontend_url={self.frontend_url})")
        game_display_name = game_name or "Whist Game"

        subject = f"You've been invited to play: {game_display_name}"
        if inviter_name:
            subject = f"{inviter_name} invited you to play: {game_display_name}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #f59e0b; 
                          color: white; text-decoration: none; border-radius: 6px; 
                          font-weight: bold; margin: 20px 0; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>You've been invited to play Whist! 🎴</h2>
                <p>{"You've been invited by " + inviter_name + " to join" if inviter_name else "You've been invited to join"} 
                   a game of Whist: <strong>{game_display_name}</strong></p>
                <p>Click the button below to accept the invitation and join the game:</p>
                <a href="{invitation_link}" class="button">Join Game</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">{invitation_link}</p>
                <div class="footer">
                    <p>This invitation link expires in 7 days.</p>
                    <p>If you don't have an account, you'll be prompted to create one when you click the link.</p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": self.from_email,
                        "to": [email],
                        "subject": subject,
                        "html": html_content,
                    },
                )
                response.raise_for_status()
                logger.info(f"Invitation email sent successfully to {email}")
                return True
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to send invitation email to {email}: {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"Error sending invitation email to {email}: {str(e)}", exc_info=True)
            return False
