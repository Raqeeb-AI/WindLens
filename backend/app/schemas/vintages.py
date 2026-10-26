from pydantic import BaseModel, Field
from typing import List, Optional

class VintagePointSchema(BaseModel):
    start_time: str
    hour_of_day: int
    forecast_mw: float
    error_mw: float
    publish_time: str
    lead_time_hours: float

class VintageRunSchema(BaseModel):
    cutoff_time: str
    cutoff_timestamp_utc: str
    mae_mw: float
    rmse_mw: float
    bias_mw: float
    mape_pct: Optional[float] = None
    mean_forecast_mw: float
    series: List[VintagePointSchema]

class ActualPointSchema(BaseModel):
    start_time: str
    hour_of_day: int
    actual_mw: float

class VintageResponse(BaseModel):
    metadata: dict
    actuals: List[ActualPointSchema]
    vintages: List[VintageRunSchema]
