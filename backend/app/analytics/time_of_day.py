from collections import defaultdict
from typing import List, Dict, Any
from backend.app.domain.models import MatchedInterval
from backend.app.analytics.metrics import calculate_metrics

def calculate_time_of_day_breakdown(matched: List[MatchedInterval]) -> List[Dict[str, Any]]:
    """
    Group matched intervals by hour of the day (0-23) and calculate accuracy metrics.
    Useful for detecting diurnal bias (e.g. peak hours vs night hours).
    """
    by_hour = defaultdict(list)
    for m in matched:
        by_hour[m.hour_of_day].append(m)
        
    breakdown = []
    for h in range(24):
        items = by_hour.get(h, [])
        metrics = calculate_metrics(items)
        breakdown.append({
            "hour_of_day": h,
            "sample_count": len(items),
            "mean_actual_mw": round(sum(m.actual_mw for m in items) / len(items), 1) if items else 0.0,
            "mean_forecast_mw": round(sum(m.forecast_mw for m in items) / len(items), 1) if items else 0.0,
            "mae_mw": metrics.mae_mw,
            "bias_mw": metrics.bias_mw,
            "rmse_mw": metrics.rmse_mw,
            "mape_pct": metrics.mape_pct
        })
    return breakdown
