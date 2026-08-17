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
    candidate_catalog_path: Path | None = None
    candidate_photo_archives: tuple[Path, ...] = ()
    evidence_dir: Path = Path("backend/data/evidence")
    admin_password: str = ""
    admin_session_secret: str = ""
    admin_session_ttl_seconds: int = 8 * 60 * 60


def get_settings() -> Settings:
    candidate_catalog_path = (
        Path(os.environ["SANTINHO_CANDIDATES_PATH"])
        if os.getenv("SANTINHO_CANDIDATES_PATH")
        else Path("backend/data/candidates.tse-2026.json")
    )
    configured_photo_archives = os.getenv("SANTINHO_CANDIDATE_PHOTO_ARCHIVES")
    candidate_photo_archives = (
        tuple(
            Path(path.strip())
            for path in configured_photo_archives.split(",")
            if path.strip()
        )
        if configured_photo_archives
        else tuple(sorted(candidate_catalog_path.parent.glob("foto_cand*_div.zip")))
    )

    return Settings(
        embeddings_path=Path(
            os.getenv(
                "SANTINHO_EMBEDDINGS_PATH",
                "backend/data/candidate_embeddings.sample.json",
            )
        ),
        candidate_catalog_path=candidate_catalog_path,
        candidate_photo_archives=candidate_photo_archives,
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
        evidence_dir=Path(os.getenv("SANTINHO_EVIDENCE_DIR", "backend/data/evidence")),
        admin_password=os.getenv("SANTINHO_ADMIN_PASSWORD", ""),
        admin_session_secret=os.getenv("SANTINHO_ADMIN_SESSION_SECRET", ""),
        admin_session_ttl_seconds=int(
            os.getenv("SANTINHO_ADMIN_SESSION_TTL_SECONDS", str(8 * 60 * 60))
        ),
    )
