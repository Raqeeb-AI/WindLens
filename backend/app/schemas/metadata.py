from pydantic import BaseModel
from typing import List, Dict, Any

class DataSourcesMetadata(BaseModel):
    actuals_source: str
    forecast_source: str
    fuelhh_unit: str
    windfor_unit: str
    alignment_method: str

class AppMetadataResponse(BaseModel):
    app_name: str
    version: str
    target_period: str
    available_decision_dates: List[str]
    available_delivery_dates: List[str]
    default_cutoff_time: str
    default_cutoff_timezone: str
    data_sources: DataSourcesMetadata
