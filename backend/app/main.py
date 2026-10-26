from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.router import api_router
from backend.app.api.deps import get_repository

app = FastAPI(
    title="WindLens API",
    description=(
        "Cutoff-aware UK national wind generation forecast intelligence API. "
        "Evaluates day-ahead procurement decisions in January 2026 using authoritative "
        "Elexon FUELHH and WINDFOR data."
    ),
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for local frontend development and deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include main v1 API router
app.include_router(api_router, prefix=settings.api_prefix)

@app.on_event("startup")
def startup_event():
    # Preload repository cache into memory on application startup
    repo = get_repository()
    dates = repo.get_available_decision_dates()
    print(f"WindLens API started successfully. Available decision dates: {len(dates)}")

@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs_url": "/docs",
        "health_url": f"{settings.api_prefix}/health",
        "metadata_url": f"{settings.api_prefix}/metadata",
        "description": "Cutoff-Aware Wind Forecast Intelligence Dashboard Backend"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
