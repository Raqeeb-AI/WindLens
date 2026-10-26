import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert "WindLens" in data["app"]

def test_metadata_endpoint(client):
    resp = client.get("/api/v1/metadata")
    assert resp.status_code == 200
    data = resp.json()
    assert "available_decision_dates" in data
    assert len(data["available_decision_dates"]) > 0
    assert "2026-01-15" in data["available_decision_dates"]
    assert data["default_cutoff_time"] == "09:00"

def test_decision_endpoint(client):
    # Test Decision Date 2026-01-15 with default cutoff 09:00
    resp = client.get("/api/v1/decision?decision_date=2026-01-15&cutoff_time=09:00")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["metadata"]["decision_date"] == "2026-01-15"
    assert data["metadata"]["delivery_date"] == "2026-01-16"
    assert len(data["intervals"]) == 24
    
    # Check that no interval has publish_time after cutoff
    cutoff_utc = data["metadata"]["cutoff_timestamp_utc"]
    for interval in data["intervals"]:
        assert interval["publish_time"] <= cutoff_utc
        assert interval["forecast_mw"] >= 0
        assert interval["actual_mw"] >= 0

    metrics = data["summary_metrics"]
    assert metrics["matched_intervals"] == 24
    assert metrics["mae_mw"] > 0
    assert metrics["rmse_mw"] >= metrics["mae_mw"]

def test_accuracy_endpoint(client):
    # Test accuracy for first week of January 2026
    resp = client.get("/api/v1/accuracy?start_date=2026-01-01&end_date=2026-01-07&cutoff_time=09:00")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["metadata"]["total_decision_days"] == 7
    assert data["metadata"]["total_evaluated_intervals"] == 7 * 24
    assert len(data["daily_breakdown"]) == 7
    assert len(data["time_of_day_breakdown"]) == 24
    assert len(data["lead_time_breakdown"]) > 0
    assert data["overall_metrics"]["mae_mw"] > 0

def test_vintages_endpoint(client):
    resp = client.get("/api/v1/vintages?decision_date=2026-01-15&cutoffs=07:00,09:00,12:00,16:00")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["metadata"]["decision_date"] == "2026-01-15"
    assert len(data["actuals"]) == 24
    assert len(data["vintages"]) == 4
    for v in data["vintages"]:
        assert len(v["series"]) == 24
        assert v["mae_mw"] > 0
