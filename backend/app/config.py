from typing import List, Literal

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(
        # Try .env.prod first (for production), then .env (for dev)
        env_file=[".env.prod", ".env"],
        case_sensitive=False,
        extra="ignore",  # Ignore extra fields in .env (e.g., old NEON_AUTH_JWT_SECRET)
    )
    # Environment
    environment: Literal["development", "production", "staging"] = "development"
    
    # Database
    # Use DATABASE_URL for Neon PostgreSQL or local PostgreSQL.
    # Neon format: postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
    database_url: str = "sqlite:///./whist.db"

    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Whist Game API"
    
    # CORS - JSON array format in .env file: ["http://localhost:4200","http://localhost:3000"]
    cors_origins: List[str] = ["http://localhost:4200", "http://localhost:3000"]
    
    # Neon Auth (see docs/plan/authentication-architecture.md)
    # Neon Auth is integrated with Neon PostgreSQL; FastAPI verifies JWTs using Neon's JWKS.
    neon_auth_jwks_url: str = ""  # JWKS URL from Neon Auth (get from Neon dashboard → Configuration)
    auth_session_cookie_name: str = "neon-auth.session_token"  # Cookie name for session token
    
    # Email Service (for invitations)
    resend_email: str = ""  # Resend API token (RESEND_EMAIL in .env)
    from_email: str = "onboarding@resend.dev"  # Sender email address (use Resend's default domain for dev, verify your domain for production)
    frontend_url: str = "http://localhost:4200"  # Frontend URL for invitation links
    invitation_secret: str = ""  # Secret for signing invitation JWT tokens (INVITATION_SECRET in .env, defaults to resend_email if not set)
    
    @property
    def effective_database_url(self) -> str:
        """Get the effective database URL."""
        return self.database_url

    @property
    def is_postgresql(self) -> bool:
        """True when the effective database is PostgreSQL (e.g. Neon)."""
        url = self.effective_database_url
        return "postgresql" in url or "postgres+" in url
    
    @property
    def is_production(self) -> bool:
        """True when running in production environment."""
        return self.environment == "production"
    
    @property
    def is_development(self) -> bool:
        """True when running in development environment."""
        return self.environment == "development"


settings = Settings()
