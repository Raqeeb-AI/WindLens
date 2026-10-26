from pydantic import BaseModel, Field
from typing import Optional

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message or error code")
    detail: Optional[str] = Field(None, description="Detailed explanation of error")

class SummaryMetricsSchema(BaseModel):
    total_intervals: int
    matched_intervals: int
    mae_mw: float = Field(..., description="Mean Absolute Error in MW")
    rmse_mw: float = Field(..., description="Root Mean Square Error in MW")
    bias_mw: float = Field(..., description="Mean Error (Forecast - Actual) in MW")
    mape_pct: Optional[float] = Field(None, description="Mean Absolute Percentage Error (%)")
    overforecast_count: int
    underforecast_count: int
    exact_count: int
    baseline_mae_mw: Optional[float] = Field(None, description="Day-ahead persistence baseline MAE in MW")
    baseline_skill_score: Optional[float] = Field(None, description="Skill score vs baseline: 1 - (MAE/Baseline_MAE)")
