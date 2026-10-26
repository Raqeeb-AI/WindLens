from pydantic import BaseModel, Field
from typing import List, Optional
from backend.app.schemas.common import SummaryMetricsSchema

class DecisionMetadata(BaseModel):
    decision_date: str
    delivery_date: str
    cutoff_timestamp_utc: str
    cutoff_time: str
    cutoff_timezone: str
    is_default_cutoff: bool
    cutoff_assumption_note: str

class DecisionIntervalSchema(BaseModel):
    start_time: str = Field(..., description="Hourly delivery interval start ISO UTC")
    hour_of_day: int
    forecast_mw: float
    actual_mw: float
    error_mw: float
    abs_error_mw: float
    percentage_error: Optional[float] = None
    error_direction: str
    publish_time: str
    lead_time_hours: float
    age_at_cutoff_hours: float
    baseline_mw: Optional[float] = None
    baseline_error_mw: Optional[float] = None

class DecisionResponse(BaseModel):
    metadata: DecisionMetadata
    summary_metrics: SummaryMetricsSchema
    intervals: List[DecisionIntervalSchema]
