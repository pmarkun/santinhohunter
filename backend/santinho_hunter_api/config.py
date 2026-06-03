from dataclasses import dataclass
import os
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    embeddings_path: Path
    database_url: str
    face_model: str
    face_detector: str
    face_device: str
    location_precision_decimals: int
    match_limit: int
    max_upload_bytes: int
    cors_origins: list[str]


def get_settings() -> Settings:
    return Settings(
        embeddings_path=Path(
            os.getenv(
                "SANTINHO_EMBEDDINGS_PATH",
                "backend/data/candidate_embeddings.sample.json",
            )
        ),
        database_url=os.getenv(
            "DATABASE_URL",
            "sqlite:///backend/data/santinhohunter.local.sqlite3",
        ),
        face_model=os.getenv("SANTINHO_FACE_MODEL", "ArcFace"),
        face_detector=os.getenv("SANTINHO_FACE_DETECTOR", "retinaface"),
        face_device=os.getenv("SANTINHO_FACE_DEVICE", "auto"),
        location_precision_decimals=int(os.getenv("SANTINHO_LOCATION_PRECISION_DECIMALS", "3")),
        match_limit=int(os.getenv("SANTINHO_MATCH_LIMIT", "5")),
        max_upload_bytes=int(os.getenv("SANTINHO_MAX_UPLOAD_BYTES", "7000000")),
        cors_origins=[
            origin.strip()
            for origin in os.getenv("SANTINHO_CORS_ORIGINS", "*").split(",")
            if origin.strip()
        ],
    )
