from dataclasses import dataclass
import os
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    embeddings_path: Path
    face_model: str
    face_detector: str
    face_device: str
    match_limit: int
    max_upload_bytes: int


def get_settings() -> Settings:
    return Settings(
        embeddings_path=Path(
            os.getenv(
                "SANTINHO_EMBEDDINGS_PATH",
                "backend/data/candidate_embeddings.sample.json",
            )
        ),
        face_model=os.getenv("SANTINHO_FACE_MODEL", "ArcFace"),
        face_detector=os.getenv("SANTINHO_FACE_DETECTOR", "retinaface"),
        face_device=os.getenv("SANTINHO_FACE_DEVICE", "auto"),
        match_limit=int(os.getenv("SANTINHO_MATCH_LIMIT", "5")),
        max_upload_bytes=int(os.getenv("SANTINHO_MAX_UPLOAD_BYTES", "7000000")),
    )
