import math
from typing import List, Optional
from backend.app.domain.models import MatchedInterval, SummaryMetrics

def calculate_metrics(matched: List[MatchedInterval]) -> SummaryMetrics:
    """
    Calculate standard, reproducible accuracy metrics for a collection of matched intervals.
    Formulas:
    - Error_t = Forecast_t - Actual_t
    - MAE = (1/N) * sum(|Error_t|)
    - RMSE = sqrt((1/N) * sum(Error_t^2))
    - Bias = (1/N) * sum(Error_t)
    - MAPE = (100 / M) * sum(|Error_t| / Actual_t) for Actual_t >= 100 MW (avoiding div by zero)
    - Skill Score = 1 - (MAE_forecast / MAE_baseline)
    """
    if not matched:
        return SummaryMetrics(
            total_intervals=0,
            matched_intervals=0,
            mae_mw=0.0,
            rmse_mw=0.0,
            bias_mw=0.0,
            mape_pct=None,
            overforecast_count=0,
            underforecast_count=0,
            exact_count=0,
            baseline_mae_mw=None,
            baseline_skill_score=None
        )
        
    n = len(matched)
    abs_errors = [m.abs_error_mw for m in matched]
    errors = [m.error_mw for m in matched]
    squared_errors = [e ** 2 for e in errors]
    
    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(squared_errors) / n)
    bias = sum(errors) / n
    
    over_count = sum(1 for m in matched if m.error_mw > 0)
    under_count = sum(1 for m in matched if m.error_mw < 0)
    exact_count = sum(1 for m in matched if m.error_mw == 0)
    
    # MAPE calculation with safeguard against small generation denominators
    # Exclude or guard when actual_mw < 100 MW to prevent extreme distorted percentages
    valid_mape_pairs = [m for m in matched if m.actual_mw >= 100.0]
    if valid_mape_pairs:
        mape = (sum(m.abs_error_mw / m.actual_mw for m in valid_mape_pairs) / len(valid_mape_pairs)) * 100.0
    else:
        mape = None
        
    # Baseline comparison (Day-Ahead Persistence)
    baseline_pairs = [m for m in matched if m.baseline_error_mw is not None]
    if baseline_pairs:
        base_mae = sum(abs(m.baseline_error_mw) for m in baseline_pairs) / len(baseline_pairs)
        if base_mae > 0:
            skill_score = 1.0 - (mae / base_mae)
        else:
            skill_score = None
    else:
        base_mae = None
        skill_score = None
        
    return SummaryMetrics(
        total_intervals=n,
        matched_intervals=n,
        mae_mw=round(mae, 2),
        rmse_mw=round(rmse, 2),
        bias_mw=round(bias, 2),
        mape_pct=round(mape, 2) if mape is not None else None,
        overforecast_count=over_count,
        underforecast_count=under_count,
        exact_count=exact_count,
        baseline_mae_mw=round(base_mae, 2) if base_mae is not None else None,
        baseline_skill_score=round(skill_score, 4) if skill_score is not None else None
    )
