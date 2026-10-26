from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Optional
from backend.app.domain.models import HourlyActual, ForecastRecord

class IDataRepository(ABC):
    @abstractmethod
    def get_actuals_by_time(self) -> Dict[datetime, HourlyActual]:
        pass

    @abstractmethod
    def get_forecasts_for_delivery_day(self, delivery_date: str) -> List[ForecastRecord]:
        pass

    @abstractmethod
    def get_forecasts_for_date_range(self, start_date: str, end_date: str) -> List[ForecastRecord]:
        pass

    @abstractmethod
    def get_available_decision_dates(self) -> List[str]:
        pass

    @abstractmethod
    def get_available_delivery_dates(self) -> List[str]:
        pass
