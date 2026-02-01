from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    # For production with Supabase, use SUPABASE_DATABASE_URL instead
    database_url: str = "sqlite:///./whist.db"
    supabase_database_url: str = ""  # Override for Supabase in production
    
    # API
    api_v1_prefix: str = "/api/v1"
    project_name: str = "Whist Game API"
    
    # CORS - JSON array format in .env file: ["http://localhost:4200","http://localhost:3000"]
    cors_origins: List[str] = ["http://localhost:4200", "http://localhost:3000"]
    
    # Supabase (Phase 2 - not used in Phase 1)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    
    @property
    def effective_database_url(self) -> str:
        """Get the effective database URL, preferring Supabase if configured"""
        if self.supabase_database_url:
            return self.supabase_database_url
        return self.database_url
    
    class Config:
        # Try .env.prod first (for production), then .env (for dev)
        env_file = [".env.prod", ".env"]
        case_sensitive = False


settings = Settings()
