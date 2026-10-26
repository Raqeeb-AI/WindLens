from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from backend.app.domain.enums import SelectionStatus, ErrorDirection

@dataclass(frozen=True)
class HourlyActual:
    start_time: datetime
    actual_mw: float
    half_hour_count: int
    settlement_date: str
    earliest_publish_time: Optional[datetime] = None
    latest_publish_time: Optional[datetime] = None

@dataclass(frozen=True)
class ForecastRecord:
    start_time: datetime
    publish_time: datetime
    forecast_mw: float
    lead_time_hours: float

@dataclass(frozen=True)
class CutoffSelectionResult:
    start_time: datetime
    publish_time: Optional[datetime]
    forecast_mw: Optional[float]
    lead_time_hours: Optional[float]
    age_at_cutoff_hours: Optional[float]
    status: SelectionStatus

@dataclass(frozen=True)
class MatchedInterval:
    start_time: datetime
    delivery_date: str
    hour_of_day: int
    forecast_mw: float
    actual_mw: float
    error_mw: float               # Forecast - Actual
    abs_error_mw: float           # |Forecast - Actual|
    percentage_error: Optional[float] # |Forecast - Actual| / Actual * 100
    error_direction: ErrorDirection
    publish_time: datetime
    lead_time_hours: float
    age_at_cutoff_hours: float
    baseline_mw: Optional[float] = None
    baseline_error_mw: Optional[float] = None

@dataclass(frozen=True)
class SummaryMetrics:
    total_intervals: int
    matched_intervals: int
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    mape_pct: Optional[float]
    overforecast_count: int
    underforecast_count: int
    exact_count: int
    baseline_mae_mw: Optional[float] = None
    baseline_skill_score: Optional[float] = None # 1 - (MAE_forecast / MAE_baseline)
