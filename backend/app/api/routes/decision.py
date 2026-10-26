from fastapi import APIRouter, Depends, Query, HTTPException
from backend.app.api.deps import get_decision_service
from backend.app.services.decision_service import DecisionService
from backend.app.schemas.decision import DecisionResponse

router = APIRouter(tags=["Decision Day"])

@router.get("/decision", response_model=DecisionResponse)
def get_decision_analysis(
    decision_date: str = Query(
        default="2026-01-15",
        description="Decision date in YYYY-MM-DD format (within Jan 2026)",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    ),
    cutoff_time: str = Query(
        default="09:00",
        description="Procurement decision cutoff time in HH:MM format",
        pattern=r"^\d{2}:\d{2}$"
    ),
    cutoff_timezone: str = Query(
        default="Europe/London",
        description="Timezone context for the cutoff time"
    ),
    service: DecisionService = Depends(get_decision_service)
):
    try:
        return service.get_decision_analysis(
            decision_date_str=decision_date,
            cutoff_time_str=cutoff_time,
            cutoff_timezone=cutoff_timezone
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
