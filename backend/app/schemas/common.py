from pydantic import BaseModel
from typing import Optional, Any


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    detail: str
    error_code: Optional[str] = None


class PaginationResponse(BaseModel):
    """Schema for paginated responses"""
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthResponse(BaseModel):
    """Schema for health check response"""
    status: str
    version: str = "1.0.0"
