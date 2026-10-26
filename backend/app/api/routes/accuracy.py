from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.api.deps import get_accuracy_service
from backend.app.services.accuracy_service import AccuracyService
from backend.app.schemas.accuracy import AccuracyResponse

router = APIRouter(tags=["Accuracy"])

@router.get("/accuracy", response_model=AccuracyResponse)
def get_accuracy_analysis(
    start_date: str = Query(
        default="2026-01-01",
        description="Start decision date in YYYY-MM-DD format",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    ),
    end_date: str = Query(
        default="2026-01-31",
        description="End decision date in YYYY-MM-DD format",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    ),
    cutoff_time: str = Query(
        default="09:00",
        description="Procurement decision cutoff time in HH:MM format",
        pattern=r"^\d{2}:\d{2}$"
    ),
    cutoff_timezone: str = Query(
        default="Europe/London",
        description="Timezone context for cutoff"
    ),
    service: AccuracyService = Depends(get_accuracy_service)
):
    try:
        return service.get_accuracy_analysis(
            start_decision_date=start_date,
            end_decision_date=end_date,
            cutoff_time_str=cutoff_time,
            cutoff_timezone=cutoff_timezone
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
