from fastapi import APIRouter
from backend.app.api.routes import health, metadata, decision, accuracy, vintages

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(metadata.router)
api_router.include_router(decision.router)
api_router.include_router(accuracy.router)
api_router.include_router(vintages.router)
