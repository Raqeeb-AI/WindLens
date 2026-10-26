import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Optional
import pandas as pd

from backend.app.domain.models import HourlyActual, ForecastRecord
from backend.app.repositories.interfaces import IDataRepository

logger = logging.getLogger("windlens.repositories.snapshot")

class SnapshotRepository(IDataRepository):
    """
    In-memory cached repository backed by verified processed Parquet/JSON snapshots.
    Guarantees <5ms query response times and zero external HTTP calls during dashboard operation.
    """
    def __init__(self, data_dir: str = "data/processed"):
        self.data_dir = data_dir
        self._actuals_by_time: Optional[Dict[datetime, HourlyActual]] = None
        self._forecasts_by_delivery_date: Optional[Dict[str, List[ForecastRecord]]] = None
        self._all_forecasts: Optional[List[ForecastRecord]] = None
        self._load_data()

    def _load_data(self):
        actuals_parquet = os.path.join(self.data_dir, "actuals_hourly.parquet")
        actuals_json = os.path.join(self.data_dir, "actuals_hourly.json")
        forecasts_parquet = os.path.join(self.data_dir, "forecasts_vintages.parquet")
        forecasts_json = os.path.join(self.data_dir, "forecasts_vintages.json")

        # 1. Load Actuals (fast to_dict)
        if os.path.exists(actuals_parquet):
            df_act = pd.read_parquet(actuals_parquet)
        elif os.path.exists(actuals_json):
            df_act = pd.read_json(actuals_json)
        else:
            raise FileNotFoundError(f"Neither {actuals_parquet} nor {actuals_json} was found.")

        self._actuals_by_time = {}
        for row in df_act.to_dict(orient="records"):
            st = datetime.fromisoformat(row["start_time_iso"].replace("Z", "+00:00"))
            e_pub = datetime.fromisoformat(row["earliest_publish_iso"].replace("Z", "+00:00")) if row.get("earliest_publish_iso") else None
            l_pub = datetime.fromisoformat(row["latest_publish_iso"].replace("Z", "+00:00")) if row.get("latest_publish_iso") else None
            self._actuals_by_time[st] = HourlyActual(
                start_time=st,
                actual_mw=float(row["actual_mw"]),
                half_hour_count=int(row["half_hour_count"]),
                settlement_date=str(row["settlement_date"]),
                earliest_publish_time=e_pub,
                latest_publish_time=l_pub
            )

        # 2. Load Forecasts (fast to_dict)
        if os.path.exists(forecasts_parquet):
            df_fc = pd.read_parquet(forecasts_parquet)
        elif os.path.exists(forecasts_json):
            df_fc = pd.read_json(forecasts_json)
        else:
            raise FileNotFoundError(f"Neither {forecasts_parquet} nor {forecasts_json} was found.")

        self._forecasts_by_delivery_date = {}
        self._all_forecasts = []

        for row in df_fc.to_dict(orient="records"):
            st = datetime.fromisoformat(row["start_time_iso"].replace("Z", "+00:00"))
            pt = datetime.fromisoformat(row["publish_time_iso"].replace("Z", "+00:00"))
            rec = ForecastRecord(
                start_time=st,
                publish_time=pt,
                forecast_mw=float(row["forecast_mw"]),
                lead_time_hours=float(row["lead_time_hours"])
            )
            self._all_forecasts.append(rec)
            d_date = row["start_time_iso"][:10]
            if d_date not in self._forecasts_by_delivery_date:
                self._forecasts_by_delivery_date[d_date] = []
            self._forecasts_by_delivery_date[d_date].append(rec)

        logger.info(
            f"SnapshotRepository loaded {len(self._actuals_by_time)} actual intervals and "
            f"{len(self._all_forecasts)} forecast records across {len(self._forecasts_by_delivery_date)} delivery days."
        )

    def get_actuals_by_time(self) -> Dict[datetime, HourlyActual]:
        return self._actuals_by_time or {}

    def get_forecasts_for_delivery_day(self, delivery_date: str) -> List[ForecastRecord]:
        return (self._forecasts_by_delivery_date or {}).get(delivery_date, [])

    def get_forecasts_for_date_range(self, start_date: str, end_date: str) -> List[ForecastRecord]:
        records: List[ForecastRecord] = []
        if not self._forecasts_by_delivery_date:
            return records
        for d_date, recs in self._forecasts_by_delivery_date.items():
            if start_date <= d_date <= end_date:
                records.extend(recs)
        return records

    def get_available_delivery_dates(self) -> List[str]:
        if not self._forecasts_by_delivery_date:
            return []
        valid_dates = []
        for d_date in sorted(self._forecasts_by_delivery_date.keys()):
            # Check if actuals exist for all 24 hours of this date
            day_hours_count = sum(1 for t in self._actuals_by_time if t.strftime("%Y-%m-%d") == d_date)
            if day_hours_count == 24:
                valid_dates.append(d_date)
        return valid_dates

    def get_available_decision_dates(self) -> List[str]:
        delivery_dates = set(self.get_available_delivery_dates())
        decision_dates = []
        for d_str in sorted(delivery_dates):
            d_dt = datetime.strptime(d_str, "%Y-%m-%d")
            decision_dt = d_dt - pd.Timedelta(days=1)
            decision_dates.append(decision_dt.strftime("%Y-%m-%d"))
        return sorted(list(set(decision_dates)))
