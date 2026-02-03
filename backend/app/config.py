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
    backend_url: str = ""  # Backend URL (for CORS and WebSocket). If empty, defaults to https://whist.api.orbasker.com in production.
    
    # CORS - JSON array format in .env file: ["http://localhost:4200","http://localhost:3000"]
    # Defaults based on environment if not set
    cors_origins: List[str] = []  # Will be set based on environment if empty
    
    # Neon Auth (see docs/plan/authentication-architecture.md)
    # Neon Auth is integrated with Neon PostgreSQL; FastAPI verifies JWTs using Neon's JWKS.
    neon_auth_jwks_url: str = ""  # JWKS URL from Neon Auth (get from Neon dashboard → Configuration)
    auth_session_cookie_name: str = "neon-auth.session_token"  # Cookie name for session token
    
    # Email Service (for invitations)
    resend_email: str = ""  # Resend API token (RESEND_EMAIL in .env)
    from_email: str = "onboarding@resend.dev"  # Sender email address (use Resend's default domain for dev, verify your domain for production)
    frontend_url: str = ""  # Frontend URL for invitation links. If empty, defaults to https://whist.orbasker.com in production.
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
    
    @property
    def is_staging(self) -> bool:
        """True when running in staging environment."""
        return self.environment == "staging"
    
    @property
    def effective_backend_url(self) -> str:
        """Get the effective backend URL based on environment."""
        if self.backend_url:
            return self.backend_url
        
        # Default based on environment
        if self.is_production:
            return "https://whist.api.orbasker.com"
        elif self.is_staging:
            return "https://api-staging.yourdomain.com"  # Should be overridden in staging
        else:
            return "http://localhost:8000"
    
    @property
    def effective_frontend_url(self) -> str:
        """Get the effective frontend URL based on environment."""
        if self.frontend_url:
            return self.frontend_url
        
        # Default based on environment
        if self.is_production:
            return "https://whist.orbasker.com"
        elif self.is_staging:
            return "https://staging.yourdomain.com"  # Should be overridden in staging
        else:
            return "http://localhost:4200"
    
    @property
    def effective_cors_origins(self) -> List[str]:
        """Get the effective CORS origins based on environment."""
        if self.cors_origins:
            return self.cors_origins
        
        # Default based on environment
        if self.is_production:
            return [self.effective_frontend_url]
        elif self.is_staging:
            return [self.effective_frontend_url]
        else:
            return ["http://localhost:4200", "http://localhost:3000"]


settings = Settings()
