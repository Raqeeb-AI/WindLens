import json
import os
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta

def run_audit():
    print("================== WINDLENS DATA & METRICS AUDIT ==================")
    actuals_path = "data/processed/actuals_hourly.parquet"
    forecasts_path = "data/processed/forecasts_vintages.parquet"
    manifest_path = "data/processed/manifest.json"

    assert os.path.exists(actuals_path), "Actuals parquet missing!"
    assert os.path.exists(forecasts_path), "Forecasts parquet missing!"
    assert os.path.exists(manifest_path), "Manifest missing!"

    with open(manifest_path) as f:
        manifest = json.load(f)
    print(f"Manifest Build Timestamp (UTC): {manifest.get('built_at_utc')}")

    df_act = pd.read_parquet(actuals_path)
    df_fc = pd.read_parquet(forecasts_path)

    print(f"\n1. Actuals dataset:")
    print(f"   Total hourly intervals: {len(df_act)}")
    print(f"   Date span: {df_act['start_time_iso'].min()} to {df_act['start_time_iso'].max()}")
    print(f"   Null actuals: {df_act['actual_mw'].isna().sum()}")
    print(f"   Negative actuals: {(df_act['actual_mw'] < 0).sum()}")
    print(f"   Average actual generation: {df_act['actual_mw'].mean():.2f} MW")
    print(f"   Half-hour pair counts: {df_act['half_hour_count'].value_counts().to_dict()}")

    print(f"\n2. Forecasts dataset:")
    print(f"   Total forecast records: {len(df_fc)}")
    print(f"   Distinct start times: {df_fc['start_time_iso'].nunique()}")
    print(f"   Distinct publication runs: {df_fc['publish_time_iso'].nunique()}")
    print(f"   Publication time span: {df_fc['publish_time_iso'].min()} to {df_fc['publish_time_iso'].max()}")
    print(f"   Null forecasts: {df_fc['forecast_mw'].isna().sum()}")
    print(f"   Negative forecasts: {(df_fc['forecast_mw'] < 0).sum()}")
    print(f"   Duplicate (startTime, publishTime) keys: {df_fc.duplicated(subset=['start_time_iso', 'publish_time_iso']).sum()}")

    # 3. Audit Cutoff Selection across all 31 Decision Days (1-31 Jan 2026)
    print(f"\n3. Auditing Cutoff Selection Rule (D-1 at 09:00 UTC) across all 31 Days...")
    from backend.app.repositories.snapshot_repository import SnapshotRepository
    from backend.app.services.accuracy_service import AccuracyService

    repo = SnapshotRepository()
    svc = AccuracyService(repo)

    result = svc.get_accuracy_analysis(
        start_decision_date="2026-01-01",
        end_decision_date="2026-01-31",
        cutoff_time_str="09:00"
    )

    meta = result["metadata"]
    overall = result["overall_metrics"]
    daily = result["daily_breakdown"]

    print(f"   Total Decision Days Evaluated: {meta['total_decision_days']}")
    print(f"   Total Evaluated Intervals: {meta['total_evaluated_intervals']} hours (Expect 31 * 24 = 744)")
    assert meta["total_evaluated_intervals"] == 744, f"Interval count mismatch: {meta['total_evaluated_intervals']}"

    print(f"   Overall MAE: {overall['mae_mw']} MW")
    print(f"   Overall Bias: {overall['bias_mw']} MW ({'Overforecast' if overall['bias_mw'] > 0 else 'Underforecast'})")
    print(f"   Overall RMSE: {overall['rmse_mw']} MW")
    print(f"   Baseline MAE (Day-Ahead Persistence): {overall['baseline_mae_mw']} MW")
    print(f"   Skill Score vs Baseline: {overall['baseline_skill_score'] * 100:.2f}%")

    # 4. Strict Lookahead Audit
    print(f"\n4. Strict Lookahead Leakage Audit:")
    from backend.app.domain.rules import select_forecast_for_interval
    leaks = 0
    total_checks = 0
    for d_item in daily:
        dec_date = d_item["decision_date"]
        del_date = d_item["delivery_date"]
        cutoff_dt = datetime.strptime(f"{dec_date} 09:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        candidates = repo.get_forecasts_for_delivery_day(del_date)
        for h in range(24):
            total_checks += 1
            st = datetime.strptime(f"{del_date} {h:02d}:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            res = select_forecast_for_interval(st, candidates, cutoff_dt)
            if res.publish_time and res.publish_time > cutoff_dt:
                leaks += 1

    print(f"   Total Interval Checks: {total_checks}")
    print(f"   Post-Cutoff Leaks Detected: {leaks}")
    assert leaks == 0, f"CRITICAL LEAK: {leaks} forecasts selected after cutoff!"

    print("\n================== AUDIT PASSED: 100% SOUND & VERIFIED ==================")

if __name__ == "__main__":
    run_audit()
