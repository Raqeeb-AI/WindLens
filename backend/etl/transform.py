"""
WindLens ETL Transformation and Snapshot Builder
Transforms raw FUELHH and WINDFOR streams into validated, clean,
harmonized hourly datasets for the analytics and API layers.
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger("windlens.etl.transform")

def transform_fuelhh(raw_records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Transform FUELHH raw records into clean hourly actual wind generation.
    - Filters to fuelType=WIND (if not already filtered)
    - Validates no nulls
    - Converts startTime to UTC datetime
    - Aggregates 30-min settlement periods into hourly means
    """
    if not raw_records:
        raise ValueError("No FUELHH records provided to transform.")
        
    df = pd.DataFrame(raw_records)
    
    # Validation
    if "fuelType" in df.columns:
        df = df[df["fuelType"] == "WIND"].copy()
        
    required_cols = ["startTime", "publishTime", "generation"]
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Missing required column '{col}' in FUELHH data.")
            
    # Check for null generation
    null_count = df["generation"].isna().sum()
    if null_count > 0:
        logger.warning(f"Dropping {null_count} rows with null generation in FUELHH.")
        df = df.dropna(subset=["generation"])
        
    # Ensure generation is numeric and non-negative
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df[df["generation"] >= 0].copy()
    
    # Parse timestamps
    df["start_dt"] = pd.to_datetime(df["startTime"], utc=True)
    df["publish_dt"] = pd.to_datetime(df["publishTime"], utc=True)
    
    # Deduplicate on startTime if needed
    df = df.drop_duplicates(subset=["startTime"]).sort_values("start_dt")
    
    # Hourly aggregation:
    # A 30-minute interval starting at 12:00:00Z belongs to the 12:00-13:00 hour.
    # A 30-minute interval starting at 12:30:00Z belongs to the 12:00-13:00 hour.
    df["hour_start"] = df["start_dt"].dt.floor("h")
    
    hourly = df.groupby("hour_start").agg(
        actual_mw=("generation", "mean"),
        half_hour_count=("generation", "count"),
        settlement_date=("settlementDate", "first"),
        earliest_publish_time=("publish_dt", "min"),
        latest_publish_time=("publish_dt", "max")
    ).reset_index()
    
    hourly["start_time_iso"] = hourly["hour_start"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    hourly["earliest_publish_iso"] = hourly["earliest_publish_time"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    hourly["latest_publish_iso"] = hourly["latest_publish_time"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Sort chronologically
    hourly = hourly.sort_values("hour_start").reset_index(drop=True)
    logger.info(f"Transformed FUELHH into {len(hourly)} hourly actual generation intervals.")
    return hourly

def transform_windfor(raw_records: List[Dict[str, Any]]) -> pd.DataFrame:
    """
    Transform WINDFOR raw records into clean forecast vintages.
    - Validates schema
    - Parses startTime and publishTime as UTC
    - Calculates lead_time_hours
    - Deduplicates on (startTime, publishTime)
    """
    if not raw_records:
        raise ValueError("No WINDFOR records provided to transform.")
        
    df = pd.DataFrame(raw_records)
    
    required_cols = ["startTime", "publishTime", "generation"]
    for col in required_cols:
        if col not in df.columns:
            raise KeyError(f"Missing required column '{col}' in WINDFOR data.")
            
    # Check for null generation
    null_count = df["generation"].isna().sum()
    if null_count > 0:
        logger.warning(f"Dropping {null_count} rows with null generation in WINDFOR.")
        df = df.dropna(subset=["generation"])
        
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df[df["generation"] >= 0].copy()
    
    # Parse timestamps
    df["start_dt"] = pd.to_datetime(df["startTime"], utc=True)
    df["publish_dt"] = pd.to_datetime(df["publishTime"], utc=True)
    
    # Deduplicate on (startTime, publishTime)
    df = df.drop_duplicates(subset=["startTime", "publishTime"]).copy()
    
    # Compute lead time in hours (delivery start minus publication timestamp)
    df["lead_time_hours"] = (df["start_dt"] - df["publish_dt"]).dt.total_seconds() / 3600.0
    
    # Standardize column names and format
    df["forecast_mw"] = df["generation"].astype(float)
    df["start_time_iso"] = df["start_dt"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    df["publish_time_iso"] = df["publish_dt"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    df = df.sort_values(["start_dt", "publish_dt"]).reset_index(drop=True)
    logger.info(f"Transformed WINDFOR into {len(df)} forecast records across {df['publish_time_iso'].nunique()} vintages.")
    return df

def save_snapshots(
    df_actuals: pd.DataFrame,
    df_forecasts: pd.DataFrame,
    output_dir: str = "data/processed"
) -> Dict[str, str]:
    """Save processed datasets as Parquet files and lightweight JSON fallbacks."""
    os.makedirs(output_dir, exist_ok=True)
    
    actuals_parquet = os.path.join(output_dir, "actuals_hourly.parquet")
    actuals_json = os.path.join(output_dir, "actuals_hourly.json")
    forecasts_parquet = os.path.join(output_dir, "forecasts_vintages.parquet")
    forecasts_json = os.path.join(output_dir, "forecasts_vintages.json")
    manifest_path = os.path.join(output_dir, "manifest.json")
    
    # Save Actuals
    actuals_cols = ["start_time_iso", "actual_mw", "half_hour_count", "settlement_date", "earliest_publish_iso", "latest_publish_iso"]
    df_actuals_out = df_actuals[actuals_cols].copy()
    df_actuals_out.to_parquet(actuals_parquet, index=False)
    df_actuals_out.to_json(actuals_json, orient="records", indent=2)
    
    # Save Forecasts
    forecast_cols = ["start_time_iso", "publish_time_iso", "forecast_mw", "lead_time_hours"]
    df_forecasts_out = df_forecasts[forecast_cols].copy()
    df_forecasts_out.to_parquet(forecasts_parquet, index=False)
    # Also save a compact JSON version
    df_forecasts_out.to_json(forecasts_json, orient="records")
    
    # Create manifest
    manifest = {
        "built_at_utc": datetime.now(timezone.utc).isoformat(),
        "actuals": {
            "total_hourly_intervals": len(df_actuals_out),
            "start_time_min": df_actuals_out["start_time_iso"].min(),
            "start_time_max": df_actuals_out["start_time_iso"].max(),
            "mean_actual_mw": round(float(df_actuals_out["actual_mw"].mean()), 2),
            "files": ["actuals_hourly.parquet", "actuals_hourly.json"]
        },
        "forecasts": {
            "total_forecast_records": len(df_forecasts_out),
            "distinct_start_times": int(df_forecasts_out["start_time_iso"].nunique()),
            "distinct_publish_times": int(df_forecasts_out["publish_time_iso"].nunique()),
            "publish_time_min": df_forecasts_out["publish_time_iso"].min(),
            "publish_time_max": df_forecasts_out["publish_time_iso"].max(),
            "files": ["forecasts_vintages.parquet", "forecasts_vintages.json"]
        }
    }
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
        
    logger.info(f"Successfully saved all snapshots and manifest to {output_dir}.")
    return {
        "actuals_parquet": actuals_parquet,
        "actuals_json": actuals_json,
        "forecasts_parquet": forecasts_parquet,
        "forecasts_json": forecasts_json,
        "manifest": manifest_path
    }
