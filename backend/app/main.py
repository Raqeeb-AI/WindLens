import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

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

# Check if built frontend assets exist in frontend/dist
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    # Mount static assets (js, css, images) under /assets
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html for root and client routes
    @app.get("/")
    def serve_frontend_root():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Allow API and docs to be handled
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
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
