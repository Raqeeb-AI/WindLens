from datetime import datetime, timezone
from typing import List, Optional
from backend.app.domain.models import ForecastRecord, CutoffSelectionResult
from backend.app.domain.enums import SelectionStatus

def select_forecast_for_interval(
    interval_start: datetime,
    candidates: List[ForecastRecord],
    cutoff_dt: datetime,
    max_age_hours: Optional[float] = None
) -> CutoffSelectionResult:
    """
    Select the forecast available at decision cutoff for a specific delivery interval.
    
    Rule:
    selected = max(publish_time) where publish_time <= cutoff_dt and start_time == interval_start
    
    Constraints:
    - Never select a forecast published after cutoff_dt.
    - If candidates is empty or no record satisfies publish_time <= cutoff_dt, return UNAVAILABLE.
    - Tie-breaking: If multiple candidates share identical maximum publish_time, deterministic order.
    """
    if interval_start.tzinfo is None:
        interval_start = interval_start.replace(tzinfo=timezone.utc)
    if cutoff_dt.tzinfo is None:
        cutoff_dt = cutoff_dt.replace(tzinfo=timezone.utc)
        
    # Filter candidates for this interval and before or at cutoff
    eligible = [
        r for r in candidates 
        if r.start_time == interval_start and r.publish_time <= cutoff_dt
    ]
    
    if not eligible:
        return CutoffSelectionResult(
            start_time=interval_start,
            publish_time=None,
            forecast_mw=None,
            lead_time_hours=None,
            age_at_cutoff_hours=None,
            status=SelectionStatus.UNAVAILABLE
        )
        
    # Select the latest publication
    selected = max(eligible, key=lambda x: (x.publish_time, x.forecast_mw))
    
    # CRITICAL AUDIT CHECK: Ensure no post-cutoff leak
    if selected.publish_time > cutoff_dt:
        raise ValueError(
            f"CRITICAL LOOKAHEAD ERROR: Selected forecast published at {selected.publish_time.isoformat()} "
            f"which is strictly after cutoff {cutoff_dt.isoformat()}."
        )
        
    age_at_cutoff = (cutoff_dt - selected.publish_time).total_seconds() / 3600.0
    status = SelectionStatus.SELECTED
    if max_age_hours is not None and age_at_cutoff > max_age_hours:
        status = SelectionStatus.STALE
        
    return CutoffSelectionResult(
        start_time=interval_start,
        publish_time=selected.publish_time,
        forecast_mw=selected.forecast_mw,
        lead_time_hours=(interval_start - selected.publish_time).total_seconds() / 3600.0,
        age_at_cutoff_hours=age_at_cutoff,
        status=status
    )
