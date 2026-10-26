from fastapi import APIRouter
from datetime import datetime, timezone
from backend.app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "server_time_utc": datetime.now(timezone.utc).isoformat()
    }
