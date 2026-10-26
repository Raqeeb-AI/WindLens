"""
WindLens ETL Fetcher
Extracts authoritative raw data from Elexon BMRS API:
- FUELHH stream (filtered to fuelType=WIND)
- WINDFOR stream (all published forecast vintages)
"""

import httpx
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("windlens.etl.fetch")
BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

def fetch_fuelhh_raw(
    start_iso: str = "2025-12-30T00:00:00Z",
    end_iso: str = "2026-02-02T23:59:59Z",
    timeout: float = 60.0
) -> List[Dict[str, Any]]:
    """Fetch raw FUELHH stream filtered to fuelType=WIND."""
    url = f"{BASE_URL}/datasets/FUELHH/stream"
    params = {
        "fuelType": "WIND",
        "publishDateTimeFrom": start_iso,
        "publishDateTimeTo": end_iso
    }
    logger.info(f"Fetching FUELHH from {start_iso} to {end_iso}...")
    with httpx.Client(timeout=timeout) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Fetched {len(data)} FUELHH wind records.")
        return data

def fetch_windfor_raw(
    start_iso: str = "2025-12-28T00:00:00Z",
    end_iso: str = "2026-02-02T23:59:59Z",
    timeout: float = 90.0
) -> List[Dict[str, Any]]:
    """Fetch raw WINDFOR stream containing all forecast publication vintages."""
    url = f"{BASE_URL}/datasets/WINDFOR/stream"
    params = {
        "publishDateTimeFrom": start_iso,
        "publishDateTimeTo": end_iso
    }
    logger.info(f"Fetching WINDFOR from {start_iso} to {end_iso}...")
    with httpx.Client(timeout=timeout) as client:
        resp = client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Fetched {len(data)} WINDFOR forecast records.")
        return data

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    f = fetch_fuelhh_raw("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z")
    w = fetch_windfor_raw("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z")
    print(f"Sample test: FUELHH count={len(f)}, WINDFOR count={len(w)}")
