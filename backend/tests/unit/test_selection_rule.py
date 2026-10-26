import pytest
from datetime import datetime, timezone
from backend.app.domain.models import ForecastRecord
from backend.app.domain.rules import select_forecast_for_interval
from backend.app.domain.enums import SelectionStatus

def test_select_forecast_latest_before_cutoff():
    interval = datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
    cutoff = datetime(2026, 1, 14, 9, 0, 0, tzinfo=timezone.utc)

    candidates = [
        ForecastRecord(interval, datetime(2026, 1, 14, 4, 30, 0, tzinfo=timezone.utc), 1000.0, 31.5),
        ForecastRecord(interval, datetime(2026, 1, 14, 7, 30, 0, tzinfo=timezone.utc), 1100.0, 28.5), # Latest before cutoff
        ForecastRecord(interval, datetime(2026, 1, 14, 11, 30, 0, tzinfo=timezone.utc), 1200.0, 24.5), # Post-cutoff
    ]

    result = select_forecast_for_interval(interval, candidates, cutoff)

    assert result.status == SelectionStatus.SELECTED
    assert result.publish_time == datetime(2026, 1, 14, 7, 30, 0, tzinfo=timezone.utc)
    assert result.forecast_mw == 1100.0
    assert result.age_at_cutoff_hours == 1.5 # 09:00 - 07:30 = 1.5h

def test_select_forecast_never_selects_post_cutoff():
    interval = datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
    cutoff = datetime(2026, 1, 14, 9, 0, 0, tzinfo=timezone.utc)

    # Only post-cutoff forecasts exist
    candidates = [
        ForecastRecord(interval, datetime(2026, 1, 14, 9, 30, 0, tzinfo=timezone.utc), 1000.0, 26.5),
        ForecastRecord(interval, datetime(2026, 1, 14, 15, 30, 0, tzinfo=timezone.utc), 1050.0, 20.5),
    ]

    result = select_forecast_for_interval(interval, candidates, cutoff)

    assert result.status == SelectionStatus.UNAVAILABLE
    assert result.publish_time is None
    assert result.forecast_mw is None

def test_select_forecast_exact_cutoff_boundary_eligible():
    interval = datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
    cutoff = datetime(2026, 1, 14, 9, 0, 0, tzinfo=timezone.utc)

    # Exact boundary match publish_time == cutoff
    candidates = [
        ForecastRecord(interval, datetime(2026, 1, 14, 9, 0, 0, tzinfo=timezone.utc), 1500.0, 27.0),
    ]

    result = select_forecast_for_interval(interval, candidates, cutoff)

    assert result.status == SelectionStatus.SELECTED
    assert result.publish_time == cutoff
    assert result.forecast_mw == 1500.0
    assert result.age_at_cutoff_hours == 0.0

def test_select_forecast_empty_candidates():
    interval = datetime(2026, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
    cutoff = datetime(2026, 1, 14, 9, 0, 0, tzinfo=timezone.utc)

    result = select_forecast_for_interval(interval, [], cutoff)

    assert result.status == SelectionStatus.UNAVAILABLE
    assert result.forecast_mw is None
