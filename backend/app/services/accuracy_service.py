from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, List, Optional

from backend.app.repositories.interfaces import IDataRepository
from backend.app.domain.rules import select_forecast_for_interval
from backend.app.analytics.matching import match_forecasts_with_actuals
from backend.app.analytics.metrics import calculate_metrics
from backend.app.analytics.time_of_day import calculate_time_of_day_breakdown
from backend.app.analytics.lead_time import calculate_lead_time_breakdown

class AccuracyService:
    def __init__(self, repository: IDataRepository):
        self.repository = repository

    def get_accuracy_analysis(
        self,
        start_decision_date: str = "2026-01-01",
        end_decision_date: str = "2026-01-31",
        cutoff_time_str: str = "09:00",
        cutoff_timezone: str = "Europe/London"
    ) -> Dict[str, Any]:
        """
        Evaluate forecast accuracy across a range of decision dates in January 2026.
        For each decision date D, delivery day D+1 is evaluated with the specified cutoff.
        """
        start_d = datetime.strptime(start_decision_date, "%Y-%m-%d").date()
        end_d = datetime.strptime(end_decision_date, "%Y-%m-%d").date()
        hour, minute = map(int, cutoff_time_str.split(":"))

        actuals = self.repository.get_actuals_by_time()

        all_matched = []
        daily_breakdown = []

        curr_d = start_d
        while curr_d <= end_d:
            d_str = curr_d.strftime("%Y-%m-%d")
            delivery_d = curr_d + timedelta(days=1)
            delivery_str = delivery_d.strftime("%Y-%m-%d")

            cutoff_dt = datetime(
                curr_d.year, curr_d.month, curr_d.day,
                hour, minute, 0, tzinfo=timezone.utc
            )

            candidates = self.repository.get_forecasts_for_delivery_day(delivery_str)
            target_hours = [
                datetime(delivery_d.year, delivery_d.month, delivery_d.day, h, 0, 0, tzinfo=timezone.utc)
                for h in range(24)
            ]

            selected_forecasts = [
                select_forecast_for_interval(st, candidates, cutoff_dt)
                for st in target_hours
            ]

            day_matched = match_forecasts_with_actuals(selected_forecasts, actuals, cutoff_dt)
            if day_matched:
                day_metrics = calculate_metrics(day_matched)
                daily_breakdown.append({
                    "decision_date": d_str,
                    "delivery_date": delivery_str,
                    "matched_intervals": day_metrics.matched_intervals,
                    "mae_mw": day_metrics.mae_mw,
                    "bias_mw": day_metrics.bias_mw,
                    "rmse_mw": day_metrics.rmse_mw,
                    "mape_pct": day_metrics.mape_pct,
                    "baseline_mae_mw": day_metrics.baseline_mae_mw,
                    "baseline_skill_score": day_metrics.baseline_skill_score,
                    "mean_actual_mw": round(sum(m.actual_mw for m in day_matched) / len(day_matched), 1),
                    "mean_forecast_mw": round(sum(m.forecast_mw for m in day_matched) / len(day_matched), 1)
                })
                all_matched.extend(day_matched)

            curr_d += timedelta(days=1)

        overall_metrics = calculate_metrics(all_matched)
        time_of_day_breakdown = calculate_time_of_day_breakdown(all_matched)
        lead_time_breakdown = calculate_lead_time_breakdown(all_matched)

        return {
            "metadata": {
                "start_decision_date": start_decision_date,
                "end_decision_date": end_decision_date,
                "cutoff_time": cutoff_time_str,
                "cutoff_timezone": cutoff_timezone,
                "total_decision_days": len(daily_breakdown),
                "total_evaluated_intervals": len(all_matched)
            },
            "overall_metrics": {
                "total_intervals": overall_metrics.total_intervals,
                "matched_intervals": overall_metrics.matched_intervals,
                "mae_mw": overall_metrics.mae_mw,
                "rmse_mw": overall_metrics.rmse_mw,
                "bias_mw": overall_metrics.bias_mw,
                "mape_pct": overall_metrics.mape_pct,
                "overforecast_count": overall_metrics.overforecast_count,
                "underforecast_count": overall_metrics.underforecast_count,
                "exact_count": overall_metrics.exact_count,
                "baseline_mae_mw": overall_metrics.baseline_mae_mw,
                "baseline_skill_score": overall_metrics.baseline_skill_score
            },
            "daily_breakdown": daily_breakdown,
            "time_of_day_breakdown": time_of_day_breakdown,
            "lead_time_breakdown": lead_time_breakdown
        }
