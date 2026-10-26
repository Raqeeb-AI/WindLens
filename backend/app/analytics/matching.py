from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from backend.app.domain.models import CutoffSelectionResult, HourlyActual, MatchedInterval
from backend.app.domain.enums import SelectionStatus, ErrorDirection

def match_forecasts_with_actuals(
    selected_forecasts: List[CutoffSelectionResult],
    actuals_by_time: Dict[datetime, HourlyActual],
    cutoff_dt: datetime
) -> List[MatchedInterval]:
    """
    Match cutoff-selected forecasts with actual generation outcomes.
    Also computes the day-ahead persistence baseline:
    Baseline for delivery interval t is actual generation at t - 24 hours.
    
    Constraint:
    Actual at t - 24h is only valid if its publication timestamp was <= cutoff_dt.
    """
    matched: List[MatchedInterval] = []
    
    for f in selected_forecasts:
        # Skip intervals where no forecast was available before cutoff
        if f.status != SelectionStatus.SELECTED or f.forecast_mw is None or f.publish_time is None:
            continue
            
        t = f.start_time
        actual = actuals_by_time.get(t)
        if actual is None:
            continue
            
        # Error metrics
        forecast_val = f.forecast_mw
        actual_val = actual.actual_mw
        error_val = forecast_val - actual_val
        abs_error_val = abs(error_val)
        
        pct_error = (abs_error_val / actual_val * 100.0) if actual_val > 0 else None
        
        if error_val > 0.001:
            direction = ErrorDirection.OVERFORECAST
        elif error_val < -0.001:
            direction = ErrorDirection.UNDERFORECAST
        else:
            direction = ErrorDirection.EXACT
            
        # Baseline: Day-Ahead Persistence (generation at t - 24 hours)
        t_minus_24 = t - timedelta(hours=24)
        prior_actual = actuals_by_time.get(t_minus_24)
        baseline_mw: Optional[float] = None
        baseline_error_mw: Optional[float] = None
        
        if prior_actual is not None:
            # Check availability constraint: was prior actual available by cutoff_dt?
            # FUELHH actuals are published ~30-60 mins after interval end.
            # If t_minus_24 was yesterday, it was published yesterday, well before cutoff_dt on decision day.
            if prior_actual.latest_publish_time is not None and prior_actual.latest_publish_time <= cutoff_dt:
                baseline_mw = prior_actual.actual_mw
                baseline_error_mw = baseline_mw - actual_val
            elif prior_actual.latest_publish_time is None:
                # If timestamp is not recorded, check if t_minus_24 + 2h <= cutoff_dt
                if t_minus_24 + timedelta(hours=2) <= cutoff_dt:
                    baseline_mw = prior_actual.actual_mw
                    baseline_error_mw = baseline_mw - actual_val
                    
        matched.append(MatchedInterval(
            start_time=t,
            delivery_date=t.strftime("%Y-%m-%d"),
            hour_of_day=t.hour,
            forecast_mw=round(forecast_val, 1),
            actual_mw=round(actual_val, 1),
            error_mw=round(error_val, 1),
            abs_error_mw=round(abs_error_val, 1),
            percentage_error=round(pct_error, 2) if pct_error is not None else None,
            error_direction=direction,
            publish_time=f.publish_time,
            lead_time_hours=round(f.lead_time_hours, 1) if f.lead_time_hours is not None else 0.0,
            age_at_cutoff_hours=round(f.age_at_cutoff_hours, 1) if f.age_at_cutoff_hours is not None else 0.0,
            baseline_mw=round(baseline_mw, 1) if baseline_mw is not None else None,
            baseline_error_mw=round(baseline_error_mw, 1) if baseline_error_mw is not None else None
        ))
        
    return sorted(matched, key=lambda x: x.start_time)
