from collections import defaultdict
from typing import List, Dict, Any
from backend.app.domain.models import MatchedInterval
from backend.app.analytics.metrics import calculate_metrics

def calculate_lead_time_breakdown(matched: List[MatchedInterval]) -> List[Dict[str, Any]]:
    """
    Group matched intervals by lead time bands (hours from forecast publication to delivery).
    Bands: 12-18h, 18-24h, 24-30h, 30-36h, 36-48h, 48h+
    """
    bands = [
        ("12-18h", 12.0, 18.0),
        ("18-24h", 18.0, 24.0),
        ("24-30h", 24.0, 30.0),
        ("30-36h", 30.0, 36.0),
        ("36-48h", 36.0, 48.0),
        ("48h+", 48.0, 1000.0)
    ]
    
    breakdown = []
    for label, min_lt, max_lt in bands:
        in_band = [
            m for m in matched 
            if min_lt <= m.lead_time_hours < max_lt or (max_lt == 1000.0 and m.lead_time_hours >= min_lt)
        ]
        if not in_band:
            continue
        metrics = calculate_metrics(in_band)
        breakdown.append({
            "lead_time_band": label,
            "min_lead_time_hours": min_lt,
            "max_lead_time_hours": max_lt if max_lt < 1000.0 else None,
            "sample_count": len(in_band),
            "mae_mw": metrics.mae_mw,
            "bias_mw": metrics.bias_mw,
            "rmse_mw": metrics.rmse_mw,
            "mape_pct": metrics.mape_pct
        })
    return breakdown
