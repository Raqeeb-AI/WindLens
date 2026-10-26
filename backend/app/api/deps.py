from functools import lru_cache
from backend.app.core.config import settings
from backend.app.repositories.snapshot_repository import SnapshotRepository
from backend.app.services.decision_service import DecisionService
from backend.app.services.accuracy_service import AccuracyService
from backend.app.services.vintage_service import VintageService

@lru_cache()
def get_repository() -> SnapshotRepository:
    return SnapshotRepository(data_dir=settings.data_dir)

def get_decision_service() -> DecisionService:
    return DecisionService(repository=get_repository())

def get_accuracy_service() -> AccuracyService:
    return AccuracyService(repository=get_repository())

def get_vintage_service() -> VintageService:
    return VintageService(repository=get_repository())
