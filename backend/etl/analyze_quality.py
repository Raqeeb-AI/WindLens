import httpx
import pandas as pd
from datetime import datetime, timezone
from collections import defaultdict, Counter

def analyze_dataset_quality():
    client = httpx.Client(timeout=60.0)
    
    # 1. Fetch FUELHH for delivery period 2026-01-01 to 2026-02-02
    print("--- 1. Analyzing FUELHH (Actuals) ---")
    r_fuel = client.get("https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream", params={
        "fuelType": "WIND",
        "publishDateTimeFrom": "2026-01-01T00:00:00Z",
        "publishDateTimeTo": "2026-02-02T00:00:00Z"
    })
    df_fuel = pd.DataFrame(r_fuel.json())
    print(f"FUELHH records count: {len(df_fuel)}")
    print(f"Columns: {list(df_fuel.columns)}")
    print(f"Missing generation count: {df_fuel['generation'].isna().sum()}")
    print(f"Negative generation count: {(df_fuel['generation'] < 0).sum()}")
    
    # Check uniqueness of (startTime) in FUELHH
    dupes_fuel = df_fuel.duplicated(subset=['startTime']).sum()
    print(f"Duplicate startTimes in FUELHH: {dupes_fuel}")
    
    # Check date span
    print(f"FUELHH min startTime: {df_fuel['startTime'].min()}, max startTime: {df_fuel['startTime'].max()}")
    print(f"FUELHH min publishTime: {df_fuel['publishTime'].min()}, max publishTime: {df_fuel['publishTime'].max()}")
    
    # 2. Fetch WINDFOR for publish period 2025-12-30 to 2026-02-02
    print("\n--- 2. Analyzing WINDFOR (Forecasts) ---")
    r_wind = client.get("https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream", params={
        "publishDateTimeFrom": "2025-12-30T00:00:00Z",
        "publishDateTimeTo": "2026-02-02T00:00:00Z"
    })
    df_wind = pd.DataFrame(r_wind.json())
    print(f"WINDFOR records count: {len(df_wind)}")
    print(f"Columns: {list(df_wind.columns)}")
    print(f"Missing generation count: {df_wind['generation'].isna().sum()}")
    print(f"Negative generation count: {(df_wind['generation'] < 0).sum()}")
    
    # Check uniqueness of (startTime, publishTime) in WINDFOR
    dupes_wind = df_wind.duplicated(subset=['startTime', 'publishTime']).sum()
    print(f"Duplicate (startTime, publishTime) in WINDFOR: {dupes_wind}")
    
    # Check publication count per delivery interval
    pub_counts = df_wind.groupby('startTime')['publishTime'].nunique()
    print(f"\nForecast publications per delivery interval:")
    print(f"  Min publications: {pub_counts.min()}")
    print(f"  Median publications: {pub_counts.median()}")
    print(f"  Mean publications: {pub_counts.mean():.1f}")
    print(f"  Max publications: {pub_counts.max()}")
    print(f"  Distribution: {Counter(pub_counts).most_common(5)}")

    # 3. Analyze Granularity Alignment & Aggregation
    print("\n--- 3. Granularity & Alignment Analysis ---")
    # FUELHH is 30-min interval. WINDFOR is 60-min interval.
    # Convert timestamps to datetime UTC
    df_fuel['start_dt'] = pd.to_datetime(df_fuel['startTime'])
    df_wind['start_dt'] = pd.to_datetime(df_wind['startTime'])
    
    # Aggregate FUELHH to hourly to compare with WINDFOR
    # An hourly interval starting at H:00 covers H:00 to H:30 and H:30 to (H+1):00
    df_fuel['hour_start'] = df_fuel['start_dt'].dt.floor('h')
    fuel_hourly = df_fuel.groupby('hour_start').agg(
        actual_mw_mean=('generation', 'mean'),
        actual_half_hours=('generation', 'count')
    ).reset_index()
    print("Sample hourly aggregated FUELHH actuals:")
    print(fuel_hourly.head())
    print(f"Hours with full 2 half-hours: {(fuel_hourly['actual_half_hours'] == 2).sum()} / {len(fuel_hourly)}")

    # 4. Test Cutoff-Aware Selection
    print("\n--- 4. Testing Cutoff-Aware Forecast Selection ---")
    # Scenario: Decision Date = 2026-01-15.
    # Target Delivery Day = 2026-01-16 (00:00 to 23:00 UTC).
    # Default Cutoff = D-1 at 09:00 Europe/London (which is 09:00 UTC in January).
    # Cutoff timestamp = 2026-01-15T09:00:00Z.
    df_wind['pub_dt'] = pd.to_datetime(df_wind['publishTime'])
    cutoff = pd.to_datetime("2026-01-15T09:00:00Z")
    
    delivery_day_start = pd.to_datetime("2026-01-16T00:00:00Z")
    delivery_day_end = pd.to_datetime("2026-01-16T23:00:00Z")
    
    # Filter target delivery hours
    target_delivery_hours = df_wind[(df_wind['start_dt'] >= delivery_day_start) & (df_wind['start_dt'] <= delivery_day_end)]
    distinct_target_hours = sorted(target_delivery_hours['start_dt'].unique())
    print(f"Target delivery day 2026-01-16 has {len(distinct_target_hours)} hourly intervals.")
    
    # Apply Cutoff Selection: for each interval, max(publishTime <= cutoff)
    eligible = target_delivery_hours[target_delivery_hours['pub_dt'] <= cutoff]
    selected_idx = eligible.groupby('start_dt')['pub_dt'].idxmax()
    selected_forecasts = eligible.loc[selected_idx].sort_values('start_dt')
    
    print(f"Selected {len(selected_forecasts)} cutoff-compliant forecasts.")
    print("\nSample selected forecasts for 2026-01-16 (Cutoff: 2026-01-15 09:00 UTC):")
    sample_display = selected_forecasts[['startTime', 'publishTime', 'generation']].copy()
    sample_display['lead_time_hours'] = (selected_forecasts['start_dt'] - selected_forecasts['pub_dt']).dt.total_seconds() / 3600
    print(sample_display.head(6).to_string(index=False))

    # Match with Hourly Actuals
    merged = pd.merge(selected_forecasts, fuel_hourly, left_on='start_dt', right_on='hour_start', how='inner')
    merged['error_mw'] = merged['generation'] - merged['actual_mw_mean'] # Forecast - Actual
    merged['abs_error_mw'] = merged['error_mw'].abs()
    mae = merged['abs_error_mw'].mean()
    bias = merged['error_mw'].mean()
    print(f"\nEvaluation against actual generation for 2026-01-16:")
    print(f"  Matched intervals: {len(merged)} / 24")
    print(f"  Mean Absolute Error (MAE): {mae:.1f} MW")
    print(f"  Forecast Bias (Mean Error): {bias:.1f} MW ({'Overforecast' if bias > 0 else 'Underforecast'})")
    print(f"  Actual Mean Generation: {merged['actual_mw_mean'].mean():.1f} MW")
    print(f"  Forecast Mean Generation: {merged['generation'].mean():.1f} MW")

if __name__ == "__main__":
    analyze_dataset_quality()
