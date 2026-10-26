from fastapi import APIRouter, Depends
from backend.app.api.deps import get_repository
from backend.app.repositories.snapshot_repository import SnapshotRepository
from backend.app.schemas.metadata import AppMetadataResponse, DataSourcesMetadata
from backend.app.core.config import settings

router = APIRouter(tags=["Metadata"])

@router.get("/metadata", response_model=AppMetadataResponse)
def get_metadata(repo: SnapshotRepository = Depends(get_repository)):
    decision_dates = repo.get_available_decision_dates()
    delivery_dates = repo.get_available_delivery_dates()

    return AppMetadataResponse(
        app_name=settings.app_name,
        version=settings.app_version,
        target_period="January 2026 Procurement Decisions",
        available_decision_dates=decision_dates,
        available_delivery_dates=delivery_dates,
        default_cutoff_time="09:00",
        default_cutoff_timezone="Europe/London",
        data_sources=DataSourcesMetadata(
            actuals_source="Elexon FUELHH (Stream, fuelType=WIND)",
            forecast_source="Elexon WINDFOR (Stream, 72h Rolling Horizon)",
            fuelhh_unit="MW (30-minute settlement period interval-average power)",
            windfor_unit="MW (60-minute interval-average power forecast)",
            alignment_method="Harmonized hourly arithmetic mean of consecutive half-hourly FUELHH settlement periods"
        )
    )
