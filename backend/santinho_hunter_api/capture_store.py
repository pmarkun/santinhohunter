from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
import sqlite3
from typing import Any, Iterator, Sequence
from uuid import uuid4

from santinho_hunter_api.models import CaptureCreateRequest, Office
from santinho_hunter_api.storage import CandidateEmbeddingStore


@dataclass(frozen=True)
class RankingRow:
    candidate_id: str
    count: int
    last_capture_at: datetime


class CaptureStore:
    def __init__(self, database_url: str, location_precision_decimals: int) -> None:
        self.database_url = database_url
        self.location_precision_decimals = location_precision_decimals
        self.is_postgres = database_url.startswith(("postgres://", "postgresql://"))

    def ensure_schema(self) -> None:
        if self.is_postgres:
            self._ensure_postgres_schema()
            return

        self._ensure_sqlite_schema()

    def create_capture(
        self,
        payload: CaptureCreateRequest,
        candidates: CandidateEmbeddingStore,
    ) -> str:
        if candidates.find(payload.selected_candidate_id) is None:
            raise ValueError("Candidato selecionado não existe na base atual")

        for match in payload.candidate_matches:
            if candidates.find(match.candidate_id) is None:
                raise ValueError(f"Candidato de match não existe: {match.candidate_id}")

        capture_id = str(uuid4())
        now = datetime.now(UTC)
        latitude_approx = self._approximate_coordinate(payload.latitude)
        longitude_approx = self._approximate_coordinate(payload.longitude)

        with self._connection() as connection:
            existing_id = self._fetch_existing_capture_id(connection, payload.client_capture_id)
            if existing_id:
                capture_id = existing_id

            self._execute(
                connection,
                """
                INSERT INTO captures (
                    id,
                    client_capture_id,
                    captured_at,
                    created_at,
                    uf,
                    city,
                    latitude_approx,
                    longitude_approx,
                    accuracy,
                    selected_candidate_id,
                    office,
                    status,
                    source
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (client_capture_id) DO UPDATE SET
                    captured_at = EXCLUDED.captured_at,
                    uf = EXCLUDED.uf,
                    city = EXCLUDED.city,
                    latitude_approx = EXCLUDED.latitude_approx,
                    longitude_approx = EXCLUDED.longitude_approx,
                    accuracy = EXCLUDED.accuracy,
                    selected_candidate_id = EXCLUDED.selected_candidate_id,
                    office = EXCLUDED.office,
                    status = EXCLUDED.status,
                    source = EXCLUDED.source
                """,
                (
                    capture_id,
                    payload.client_capture_id,
                    payload.captured_at,
                    now,
                    payload.uf,
                    payload.city,
                    latitude_approx,
                    longitude_approx,
                    payload.accuracy,
                    payload.selected_candidate_id,
                    payload.office,
                    payload.status,
                    payload.source,
                ),
            )
            self._execute(
                connection,
                "DELETE FROM capture_matches WHERE capture_id = ?",
                (capture_id,),
            )
            for match in payload.candidate_matches:
                self._execute(
                    connection,
                    """
                    INSERT INTO capture_matches (
                        capture_id,
                        candidate_id,
                        confidence,
                        match_type,
                        rank
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        capture_id,
                        match.candidate_id,
                        match.confidence,
                        match.match_type,
                        match.rank,
                    ),
                )

            connection.commit()

        return capture_id

    def ranking(self, uf: str, office: Office) -> list[RankingRow]:
        with self._connection() as connection:
            rows = self._fetchall(
                connection,
                """
                SELECT selected_candidate_id, COUNT(*) AS total, MAX(captured_at) AS last_capture_at
                FROM captures
                WHERE uf = ?
                  AND office = ?
                  AND status = 'confirmed'
                  AND selected_candidate_id IS NOT NULL
                GROUP BY selected_candidate_id
                ORDER BY total DESC, last_capture_at DESC
                """,
                (uf, office),
            )

        return [
            RankingRow(
                candidate_id=str(row[0]),
                count=int(row[1]),
                last_capture_at=self._parse_datetime(row[2]),
            )
            for row in rows
        ]

    def _ensure_sqlite_schema(self) -> None:
        sqlite_path = self._sqlite_path()
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS captures (
                    id TEXT PRIMARY KEY,
                    captured_at TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    uf TEXT NOT NULL,
                    city TEXT,
                    latitude_approx REAL,
                    longitude_approx REAL,
                    accuracy REAL,
                    selected_candidate_id TEXT NOT NULL,
                    office TEXT NOT NULL,
                    status TEXT NOT NULL,
                    source TEXT NOT NULL,
                    client_capture_id TEXT NOT NULL UNIQUE
                );

                CREATE TABLE IF NOT EXISTS capture_matches (
                    capture_id TEXT NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
                    candidate_id TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    match_type TEXT NOT NULL,
                    rank INTEGER NOT NULL,
                    PRIMARY KEY (capture_id, candidate_id, match_type, rank)
                );
                """
            )
            connection.commit()

    def _ensure_postgres_schema(self) -> None:
        with self._connection() as connection:
            self._execute(
                connection,
                """
                CREATE TABLE IF NOT EXISTS captures (
                    id TEXT PRIMARY KEY,
                    captured_at TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL,
                    uf TEXT NOT NULL,
                    city TEXT,
                    latitude_approx DOUBLE PRECISION,
                    longitude_approx DOUBLE PRECISION,
                    accuracy DOUBLE PRECISION,
                    selected_candidate_id TEXT NOT NULL,
                    office TEXT NOT NULL,
                    status TEXT NOT NULL,
                    source TEXT NOT NULL,
                    client_capture_id TEXT NOT NULL UNIQUE
                )
                """,
                (),
            )
            self._execute(
                connection,
                """
                CREATE TABLE IF NOT EXISTS capture_matches (
                    capture_id TEXT NOT NULL REFERENCES captures(id) ON DELETE CASCADE,
                    candidate_id TEXT NOT NULL,
                    confidence DOUBLE PRECISION NOT NULL,
                    match_type TEXT NOT NULL,
                    rank INTEGER NOT NULL,
                    PRIMARY KEY (capture_id, candidate_id, match_type, rank)
                )
                """,
                (),
            )
            connection.commit()

    @contextmanager
    def _connection(self) -> Iterator[Any]:
        if self.is_postgres:
            import psycopg

            connection = psycopg.connect(self.database_url)
            try:
                yield connection
            finally:
                connection.close()
            return

        connection = sqlite3.connect(self._sqlite_path())
        try:
            yield connection
        finally:
            connection.close()

    def _sqlite_path(self) -> Path:
        if not self.database_url.startswith("sqlite:///"):
            raise ValueError("Only sqlite:/// and postgresql:// database URLs are supported")

        return Path(self.database_url.replace("sqlite:///", "", 1))

    def _execute(self, connection: Any, query: str, params: Sequence[Any]) -> Any:
        if self.is_postgres:
            query = query.replace("?", "%s")
        converted_params = tuple(self._serialize_param(param) for param in params)
        return connection.execute(query, converted_params)

    def _fetchall(self, connection: Any, query: str, params: Sequence[Any]) -> list[Any]:
        cursor = self._execute(connection, query, params)
        return list(cursor.fetchall())

    def _fetch_existing_capture_id(self, connection: Any, client_capture_id: str) -> str | None:
        rows = self._fetchall(
            connection,
            "SELECT id FROM captures WHERE client_capture_id = ?",
            (client_capture_id,),
        )
        return str(rows[0][0]) if rows else None

    def _approximate_coordinate(self, value: float | None) -> float | None:
        if value is None:
            return None

        return round(value, self.location_precision_decimals)

    def _serialize_param(self, value: Any) -> Any:
        if isinstance(value, datetime):
            return value.isoformat()

        return value

    def _parse_datetime(self, value: Any) -> datetime:
        if isinstance(value, datetime):
            return value

        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
