from pathlib import Path
import sqlite3

from fastapi.testclient import TestClient

from santinho_hunter_api.config import Settings
from santinho_hunter_api.main import app
from santinho_hunter_api.main import create_app


def make_test_client(tmp_path: Path) -> TestClient:
    return TestClient(
        create_app(
            Settings(
                embeddings_path=Path("backend/data/candidate_embeddings.sample.json"),
                database_url=f"sqlite:///{tmp_path / 'captures.sqlite3'}",
                face_model="ArcFace",
                face_detector="retinaface",
                face_device="auto",
                location_precision_decimals=3,
                match_limit=5,
                max_upload_bytes=7000000,
                cors_origins=["*"],
            )
        )
    )


def test_health_returns_embedding_count() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["embeddings_count"] >= 1


def test_match_embedding_returns_ranked_candidates() -> None:
    client = TestClient(app)

    response = client.post(
        "/matches/embedding",
        json={
            "uf": "SP",
            "office": "governor",
            "embedding": [0.95, 0.05, 0.1, 0.0],
            "limit": 2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "precomputed_embedding"
    assert body["matches"][0]["candidate_id"] == "sp-governor-10"


def test_create_capture_returns_synced_and_approximates_location(tmp_path: Path) -> None:
    database_path = tmp_path / "captures.sqlite3"
    client = TestClient(
        create_app(
            Settings(
                embeddings_path=Path("backend/data/candidate_embeddings.sample.json"),
                database_url=f"sqlite:///{database_path}",
                face_model="ArcFace",
                face_detector="retinaface",
                face_device="auto",
                location_precision_decimals=3,
                match_limit=5,
                max_upload_bytes=7000000,
                cors_origins=["*"],
            )
        )
    )

    response = client.post(
        "/captures",
        json={
            "client_capture_id": "local-capture-1",
            "captured_at": "2026-06-02T12:00:00Z",
            "uf": "SP",
            "city": "Sao Paulo",
            "latitude": -23.550519,
            "longitude": -46.633309,
            "accuracy": 12.4,
            "selected_candidate_id": "sp-governor-10",
            "office": "governor",
            "candidate_matches": [
                {
                    "candidate_id": "sp-governor-10",
                    "confidence": 0.91,
                    "match_type": "face_vector",
                    "rank": 1,
                }
            ],
        },
    )

    assert response.status_code == 200
    assert response.json()["sync_status"] == "synced"

    connection = sqlite3.connect(database_path)
    try:
        row = connection.execute(
            "SELECT latitude_approx, longitude_approx FROM captures WHERE client_capture_id = ?",
            ("local-capture-1",),
        ).fetchone()
    finally:
        connection.close()

    assert row == (-23.551, -46.633)


def test_create_capture_rejects_invalid_uf_and_office(tmp_path: Path) -> None:
    client = make_test_client(tmp_path)

    response = client.post(
        "/captures",
        json={
            "client_capture_id": "local-capture-invalid",
            "captured_at": "2026-06-02T12:00:00Z",
            "uf": "XX",
            "selected_candidate_id": "sp-governor-10",
            "office": "fake_office",
            "candidate_matches": [],
        },
    )

    assert response.status_code == 422


def test_ranking_aggregates_confirmed_captures_by_candidate(tmp_path: Path) -> None:
    client = make_test_client(tmp_path)

    for index in range(2):
        response = client.post(
            "/captures",
            json={
                "client_capture_id": f"ranking-capture-{index}",
                "captured_at": f"2026-06-02T12:0{index}:00Z",
                "uf": "SP",
                "selected_candidate_id": "sp-governor-10",
                "office": "governor",
                "candidate_matches": [],
            },
        )
        assert response.status_code == 200

    response = client.get("/rankings?uf=SP&office=governor")

    assert response.status_code == 200
    body = response.json()
    assert body["uf"] == "SP"
    assert body["office"] == "governor"
    assert body["entries"][0]["candidate"]["id"] == "sp-governor-10"
    assert body["entries"][0]["count"] == 2


def test_ranking_does_not_expose_coordinates(tmp_path: Path) -> None:
    client = make_test_client(tmp_path)
    response = client.post(
        "/captures",
        json={
            "client_capture_id": "coordinate-capture",
            "captured_at": "2026-06-02T12:00:00Z",
            "uf": "SP",
            "latitude": -23.550519,
            "longitude": -46.633309,
            "selected_candidate_id": "sp-governor-10",
            "office": "governor",
            "candidate_matches": [],
        },
    )
    assert response.status_code == 200

    ranking = client.get("/rankings?uf=SP&office=governor").json()

    assert "latitude" not in str(ranking)
    assert "longitude" not in str(ranking)
    assert "-23.550519" not in str(ranking)
    assert "-46.633309" not in str(ranking)


def test_candidate_search_by_number(tmp_path: Path) -> None:
    client = make_test_client(tmp_path)

    response = client.get("/candidates/search?uf=SP&number=10&office=governor")

    assert response.status_code == 200
    body = response.json()
    assert body["candidates"][0]["id"] == "sp-governor-10"
