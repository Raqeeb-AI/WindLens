from pydantic import BaseModel, Field
from typing import List, Optional
from backend.app.schemas.common import SummaryMetricsSchema

class AccuracyMetadata(BaseModel):
    start_decision_date: str
    end_decision_date: str
    cutoff_time: str
    cutoff_timezone: str
    total_decision_days: int
    total_evaluated_intervals: int

class DailyBreakdownSchema(BaseModel):
    decision_date: str
    delivery_date: str
    matched_intervals: int
    mae_mw: float
    bias_mw: float
    rmse_mw: float
    mape_pct: Optional[float] = None
    baseline_mae_mw: Optional[float] = None
    baseline_skill_score: Optional[float] = None
    mean_actual_mw: float
    mean_forecast_mw: float

class TimeOfDayBreakdownSchema(BaseModel):
    hour_of_day: int
    sample_count: int
    mean_actual_mw: float
    mean_forecast_mw: float
    mae_mw: float
    bias_mw: float
    rmse_mw: float
    mape_pct: Optional[float] = None

class LeadTimeBreakdownSchema(BaseModel):
    lead_time_band: str
    min_lead_time_hours: float
    max_lead_time_hours: Optional[float] = None
    sample_count: int
    mae_mw: float
    bias_mw: float
    rmse_mw: float
    mape_pct: Optional[float] = None

class AccuracyResponse(BaseModel):
    metadata: AccuracyMetadata
    overall_metrics: SummaryMetricsSchema
    daily_breakdown: List[DailyBreakdownSchema]
    time_of_day_breakdown: List[TimeOfDayBreakdownSchema]
    lead_time_breakdown: List[LeadTimeBreakdownSchema]
