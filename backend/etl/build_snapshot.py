"""
WindLens Master Snapshot Builder
Fetches real January 2026 Elexon data, runs verification,
transforms into hourly models, and persists snapshots to data/processed/.
"""

import sys
import logging
from backend.etl.fetch import fetch_fuelhh_raw, fetch_windfor_raw
from backend.etl.transform import transform_fuelhh, transform_windfor, save_snapshots

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("windlens.etl.build_snapshot")

def main():
    logger.info("=== Starting WindLens Snapshot Build for January 2026 ===")
    
    # 1. Fetch FUELHH Actuals (covering 2025-12-30 to 2026-02-03)
    fuel_records = fetch_fuelhh_raw(
        start_iso="2025-12-30T00:00:00Z",
        end_iso="2026-02-03T00:00:00Z"
    )
    
    # 2. Fetch WINDFOR Forecasts (covering 2025-12-28 to 2026-02-03)
    wind_records = fetch_windfor_raw(
        start_iso="2025-12-28T00:00:00Z",
        end_iso="2026-02-03T00:00:00Z"
    )
    
    # 3. Transform & Validate
    df_actuals = transform_fuelhh(fuel_records)
    df_forecasts = transform_windfor(wind_records)
    
    # 4. Save Snapshots
    paths = save_snapshots(df_actuals, df_forecasts, output_dir="data/processed")
    
    logger.info("=== WindLens Snapshot Build Complete! ===")
    for k, v in paths.items():
        logger.info(f"  {k}: {v}")

if __name__ == "__main__":
    main()
