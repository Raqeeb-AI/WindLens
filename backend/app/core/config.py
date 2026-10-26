import os
from dataclasses import dataclass, field
from typing import List

@dataclass
class Settings:
    app_name: str = "WindLens"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    data_dir: str = os.getenv("WINDLENS_DATA_DIR", "data/processed")
    cors_origins: List[str] = field(default_factory=lambda: ["*"])

settings = Settings()
