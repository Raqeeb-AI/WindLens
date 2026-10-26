from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional
import pandas as pd

from backend.app.repositories.interfaces import IDataRepository
from backend.app.domain.rules import select_forecast_for_interval
from backend.app.analytics.matching import match_forecasts_with_actuals
from backend.app.analytics.metrics import calculate_metrics

class DecisionService:
    def __init__(self, repository: IDataRepository):
        self.repository = repository

    def get_decision_analysis(
        self,
        decision_date_str: str,
        cutoff_time_str: str = "09:00",
        cutoff_timezone: str = "Europe/London"
    ) -> Dict[str, Any]:
        """
        Evaluate forecast available at the specified cutoff on Decision Date D
        for Day-Ahead physical delivery on Delivery Date D+1.
        
        Example:
        - Decision Date D: 2026-01-15
        - Cutoff: 09:00 Europe/London -> 2026-01-15T09:00:00Z
        - Target Delivery Day D+1: 2026-01-16 (24 hourly intervals 00:00 to 23:00)
        """
        # Parse decision date
        decision_dt = datetime.strptime(decision_date_str, "%Y-%m-%d").date()
        delivery_dt = decision_dt + timedelta(days=1)
        delivery_date_str = delivery_dt.strftime("%Y-%m-%d")

        # Parse cutoff time
        hour, minute = map(int, cutoff_time_str.split(":"))
        # In January, Europe/London is GMT (UTC+0).
        # We construct timezone-aware UTC cutoff datetime:
        cutoff_dt = datetime(
            decision_dt.year, decision_dt.month, decision_dt.day,
            hour, minute, 0, tzinfo=timezone.utc
        )

        # 1. Fetch candidate forecasts for target delivery day
        candidates = self.repository.get_forecasts_for_delivery_day(delivery_date_str)

        # 2. For each hourly interval of delivery day (24 hours), apply the cutoff selection rule
        target_hours = [
            datetime(delivery_dt.year, delivery_dt.month, delivery_dt.day, h, 0, 0, tzinfo=timezone.utc)
            for h in range(24)
        ]

        selected_forecasts = [
            select_forecast_for_interval(st, candidates, cutoff_dt)
            for st in target_hours
        ]

        # 3. Match with actual generation outcomes
        actuals = self.repository.get_actuals_by_time()
        matched = match_forecasts_with_actuals(selected_forecasts, actuals, cutoff_dt)

        # 4. Calculate summary metrics
        summary = calculate_metrics(matched)

        # 5. Format response payload
        interval_results = []
        for m in matched:
            interval_results.append({
                "start_time": m.start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "hour_of_day": m.hour_of_day,
                "forecast_mw": m.forecast_mw,
                "actual_mw": m.actual_mw,
                "error_mw": m.error_mw,
                "abs_error_mw": m.abs_error_mw,
                "percentage_error": m.percentage_error,
                "error_direction": m.error_direction.value,
                "publish_time": m.publish_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "lead_time_hours": m.lead_time_hours,
                "age_at_cutoff_hours": m.age_at_cutoff_hours,
                "baseline_mw": m.baseline_mw,
                "baseline_error_mw": m.baseline_error_mw
            })

        return {
            "metadata": {
                "decision_date": decision_date_str,
                "delivery_date": delivery_date_str,
                "cutoff_timestamp_utc": cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "cutoff_time": cutoff_time_str,
                "cutoff_timezone": cutoff_timezone,
                "is_default_cutoff": (cutoff_time_str == "09:00"),
                "cutoff_assumption_note": (
                    "09:00 London time is an illustrative demonstration cutoff assumption, "
                    "not a statutory market gate closure."
                )
            },
            "summary_metrics": {
                "total_intervals": summary.total_intervals,
                "matched_intervals": summary.matched_intervals,
                "mae_mw": summary.mae_mw,
                "rmse_mw": summary.rmse_mw,
                "bias_mw": summary.bias_mw,
                "mape_pct": summary.mape_pct,
                "overforecast_count": summary.overforecast_count,
                "underforecast_count": summary.underforecast_count,
                "exact_count": summary.exact_count,
                "baseline_mae_mw": summary.baseline_mae_mw,
                "baseline_skill_score": summary.baseline_skill_score
            },
            "intervals": interval_results
        }
