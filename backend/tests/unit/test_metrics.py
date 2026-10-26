import pytest
from datetime import datetime, timezone
from backend.app.domain.models import MatchedInterval
from backend.app.domain.enums import ErrorDirection
from backend.app.analytics.metrics import calculate_metrics

def make_interval(forecast: float, actual: float, baseline: float = None):
    err = forecast - actual
    direction = ErrorDirection.OVERFORECAST if err > 0 else (ErrorDirection.UNDERFORECAST if err < 0 else ErrorDirection.EXACT)
    base_err = (baseline - actual) if baseline is not None else None
    return MatchedInterval(
        start_time=datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc),
        delivery_date="2026-01-15",
        hour_of_day=12,
        forecast_mw=forecast,
        actual_mw=actual,
        error_mw=err,
        abs_error_mw=abs(err),
        percentage_error=(abs(err) / actual * 100.0) if actual > 0 else None,
        error_direction=direction,
        publish_time=datetime(2026, 1, 14, 7, 30, 0, tzinfo=timezone.utc),
        lead_time_hours=28.5,
        age_at_cutoff_hours=1.5,
        baseline_mw=baseline,
        baseline_error_mw=base_err
    )

def test_calculate_metrics_formulas():
    # 3 intervals:
    # 1. Forecast 1100, Actual 1000 -> Error +100 (Over)
    # 2. Forecast 800,  Actual 1000 -> Error -200 (Under)
    # 3. Forecast 1000, Actual 1000 -> Error 0    (Exact)
    items = [
        make_interval(1100.0, 1000.0, baseline=900.0), # base_err = -100
        make_interval(800.0, 1000.0, baseline=1200.0), # base_err = +200
        make_interval(1000.0, 1000.0, baseline=1000.0) # base_err = 0
    ]

    metrics = calculate_metrics(items)

    # MAE = (|100| + |-200| + |0|) / 3 = 300 / 3 = 100.0
    assert metrics.mae_mw == 100.0
    # Bias = (100 - 200 + 0) / 3 = -100 / 3 = -33.33
    assert metrics.bias_mw == -33.33
    # RMSE = sqrt((100^2 + (-200)^2 + 0^2) / 3) = sqrt(50000 / 3) = sqrt(16666.67) = 129.10
    assert metrics.rmse_mw == 129.10
    # Over: 1, Under: 1, Exact: 1
    assert metrics.overforecast_count == 1
    assert metrics.underforecast_count == 1
    assert metrics.exact_count == 1
    # Baseline MAE = (100 + 200 + 0) / 3 = 100.0
    assert metrics.baseline_mae_mw == 100.0
    # Skill score = 1 - (100 / 100) = 0.0
    assert metrics.baseline_skill_score == 0.0

def test_calculate_metrics_empty():
    metrics = calculate_metrics([])
    assert metrics.total_intervals == 0
    assert metrics.mae_mw == 0.0
    assert metrics.mape_pct is None
