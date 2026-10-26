from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from backend.app.api.deps import get_vintage_service
from backend.app.services.vintage_service import VintageService
from backend.app.schemas.vintages import VintageResponse

router = APIRouter(tags=["Vintages"])

@router.get("/vintages", response_model=VintageResponse)
def get_vintage_comparison(
    decision_date: str = Query(
        default="2026-01-15",
        description="Decision date in YYYY-MM-DD format",
        pattern=r"^\d{4}-\d{2}-\d{2}$"
    ),
    cutoffs: str = Query(
        default="07:00,09:00,12:00,16:00,22:00",
        description="Comma-separated list of cutoff times in HH:MM format"
    ),
    service: VintageService = Depends(get_vintage_service)
):
    try:
        cutoff_list = [c.strip() for c in cutoffs.split(",") if c.strip()]
        return service.get_vintage_comparison(
            decision_date_str=decision_date,
            cutoffs=cutoff_list
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
