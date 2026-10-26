from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional

from backend.app.repositories.interfaces import IDataRepository
from backend.app.domain.rules import select_forecast_for_interval
from backend.app.analytics.matching import match_forecasts_with_actuals
from backend.app.analytics.metrics import calculate_metrics

class VintageService:
    def __init__(self, repository: IDataRepository):
        self.repository = repository

    def get_vintage_comparison(
        self,
        decision_date_str: str,
        cutoffs: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Compare forecast evolution across multiple cutoff points for the same delivery day.
        Default cutoffs on decision day D:
        - "07:00"
        - "09:00" (Default benchmark)
        - "12:00"
        - "16:00"
        - "22:00"
        """
        if cutoffs is None:
            cutoffs = ["07:00", "09:00", "12:00", "16:00", "22:00"]

        decision_dt = datetime.strptime(decision_date_str, "%Y-%m-%d").date()
        delivery_dt = decision_dt + timedelta(days=1)
        delivery_str = delivery_dt.strftime("%Y-%m-%d")

        candidates = self.repository.get_forecasts_for_delivery_day(delivery_str)
        actuals = self.repository.get_actuals_by_time()

        target_hours = [
            datetime(delivery_dt.year, delivery_dt.month, delivery_dt.day, h, 0, 0, tzinfo=timezone.utc)
            for h in range(24)
        ]

        vintages_result = []

        for c_time in cutoffs:
            hour, minute = map(int, c_time.split(":"))
            cutoff_dt = datetime(
                decision_dt.year, decision_dt.month, decision_dt.day,
                hour, minute, 0, tzinfo=timezone.utc
            )

            selected_forecasts = [
                select_forecast_for_interval(st, candidates, cutoff_dt)
                for st in target_hours
            ]

            matched = match_forecasts_with_actuals(selected_forecasts, actuals, cutoff_dt)
            metrics = calculate_metrics(matched)

            vintages_result.append({
                "cutoff_time": c_time,
                "cutoff_timestamp_utc": cutoff_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "mae_mw": metrics.mae_mw,
                "rmse_mw": metrics.rmse_mw,
                "bias_mw": metrics.bias_mw,
                "mape_pct": metrics.mape_pct,
                "mean_forecast_mw": round(sum(m.forecast_mw for m in matched) / len(matched), 1) if matched else 0.0,
                "series": [
                    {
                        "start_time": m.start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "hour_of_day": m.hour_of_day,
                        "forecast_mw": m.forecast_mw,
                        "error_mw": m.error_mw,
                        "publish_time": m.publish_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "lead_time_hours": m.lead_time_hours
                    }
                    for m in matched
                ]
            })

        # Also get the actual generation series for reference
        actual_series = []
        for th in target_hours:
            act = actuals.get(th)
            if act:
                actual_series.append({
                    "start_time": th.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "hour_of_day": th.hour,
                    "actual_mw": round(act.actual_mw, 1)
                })

        return {
            "metadata": {
                "decision_date": decision_date_str,
                "delivery_date": delivery_str,
                "cutoffs_evaluated": cutoffs
            },
            "actuals": actual_series,
            "vintages": vintages_result
        }
