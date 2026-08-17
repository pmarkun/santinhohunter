from io import BytesIO
from pathlib import Path
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from time import sleep

from fastapi.testclient import TestClient
from PIL import Image

from santinho_hunter_api.config import Settings
from santinho_hunter_api.face.deepface_provider import DeepFaceProvider
from santinho_hunter_api.face.provider import FaceAnalysis, FaceEmbedding
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


def test_match_image_groups_every_detected_face(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(
        DeepFaceProvider,
        "analyze_image_bytes",
        lambda _self, _image_bytes: FaceAnalysis(
            faces=[
                FaceEmbedding([0.9, 0.1, 0.1, 0.0], box=(10, 20, 30, 40)),
                FaceEmbedding([0.1, 0.9, 0.1, 0.0], box=(50, 80, 20, 50)),
            ],
            detection_ms=12.5,
            embedding_ms=8.5,
        ),
    )
    image_buffer = BytesIO()
    Image.new("RGB", (100, 200), "white").save(image_buffer, format="JPEG")
    client = make_test_client(tmp_path)

    response = client.post(
        "/matches?uf=SP&office=governor",
        files={"file": ("santinho.jpg", image_buffer.getvalue(), "image/jpeg")},
    )

    assert response.status_code == 200
    assert "detect;dur=12.5" in response.headers["server-timing"]
    assert "embed;dur=8.5" in response.headers["server-timing"]
    body = response.json()
    assert [face["face_id"] for face in body["faces"]] == ["face-0", "face-1"]
    assert body["faces"][0]["matches"][0]["candidate_id"] == "sp-governor-10"
    assert body["faces"][1]["matches"][0]["candidate_id"] == "sp-governor-13"
    assert body["faces"][0]["bounding_box"] == {
        "x": 0.1,
        "y": 0.1,
        "width": 0.3,
        "height": 0.2,
    }
    assert body["matches"] == body["faces"][0]["matches"]


def test_match_image_limits_face_analysis_concurrency(tmp_path: Path, monkeypatch) -> None:
    active = 0
    maximum_active = 0
    lock = Lock()

    def analyze(_self, _image_bytes):
        nonlocal active, maximum_active
        with lock:
            active += 1
            maximum_active = max(maximum_active, active)
        sleep(0.05)
        with lock:
            active -= 1
        return FaceAnalysis(faces=[], detection_ms=50, embedding_ms=0)

    monkeypatch.setattr(DeepFaceProvider, "analyze_image_bytes", analyze)
    image_buffer = BytesIO()
    Image.new("RGB", (100, 200), "white").save(image_buffer, format="JPEG")
    image = image_buffer.getvalue()
    client = make_test_client(tmp_path)

    def request_match():
        return client.post(
            "/matches?uf=SP",
            files={"file": ("santinho.jpg", image, "image/jpeg")},
        )

    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(lambda _index: request_match(), range(2)))

    assert [response.status_code for response in responses] == [200, 200]
    assert maximum_active == 1
    assert any("queue;dur=" in response.headers["server-timing"] for response in responses)


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


def test_capture_with_multiple_candidates_counts_each_candidate_once(tmp_path: Path) -> None:
    database_path = tmp_path / "captures.sqlite3"
    client = make_test_client(tmp_path)

    response = client.post(
        "/captures",
        json={
            "client_capture_id": "multi-candidate-capture",
            "captured_at": "2026-06-02T12:00:00Z",
            "uf": "SP",
            "selected_candidates": [
                {
                    "candidate_id": "sp-governor-10",
                    "office": "governor",
                    "face_id": "face-0",
                    "selection_type": "face_vector",
                    "confidence": 0.91,
                },
                {
                    "candidate_id": "sp-governor-13",
                    "office": "governor",
                    "face_id": "face-1",
                    "selection_type": "manual_selection",
                    "confidence": 1,
                },
                {
                    "candidate_id": "sp-governor-10",
                    "office": "governor",
                    "face_id": "face-2",
                    "selection_type": "face_vector",
                    "confidence": 0.88,
                },
            ],
            "candidate_matches": [],
        },
    )

    assert response.status_code == 200
    ranking = client.get("/rankings?uf=SP&office=governor").json()["entries"]
    assert {entry["candidate"]["id"]: entry["count"] for entry in ranking} == {
        "sp-governor-10": 1,
        "sp-governor-13": 1,
    }

    connection = sqlite3.connect(database_path)
    try:
        relation_count = connection.execute(
            "SELECT COUNT(*) FROM capture_candidates"
        ).fetchone()[0]
    finally:
        connection.close()

    assert relation_count == 2


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


def test_candidate_search_uses_catalog_when_available(tmp_path: Path) -> None:
    catalog_path = tmp_path / "candidates.json"
    catalog_path.write_text(
        """
{
  "metadata": {"source": "test"},
  "candidates": [
    {
      "id": "250002530092",
      "election_year": 2026,
      "uf": "SP",
      "office": "federal_deputy",
      "number": "3016",
      "ballot_name": "PROF. FRED DALLY",
      "full_name": "Fredson Santos Dally",
      "party": "NOVO",
      "photo_url": null
    }
  ]
}
""",
        encoding="utf-8",
    )
    client = TestClient(
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
                candidate_catalog_path=catalog_path,
            )
        )
    )

    response = client.get("/candidates/search?uf=SP&number=3016&office=federal_deputy")

    assert response.status_code == 200
    body = response.json()
    assert body["candidates"] == [
        {
            "id": "250002530092",
            "election_year": 2026,
            "uf": "SP",
            "office": "federal_deputy",
            "number": "3016",
            "ballot_name": "PROF. FRED DALLY",
            "full_name": "Fredson Santos Dally",
            "party": "NOVO",
            "photo_url": None,
        }
    ]
