from io import BytesIO
from pathlib import Path
import sqlite3

from fastapi.testclient import TestClient
from PIL import Image

from santinho_hunter_api.admin_auth import AdminAuthenticator, AdminAuthError
from santinho_hunter_api.config import Settings
from santinho_hunter_api.main import create_app


def make_client(tmp_path: Path) -> tuple[TestClient, Path, Path]:
    database_path = tmp_path / "captures.sqlite3"
    evidence_dir = tmp_path / "evidence"
    app = create_app(
        Settings(
            embeddings_path=Path("backend/data/candidate_embeddings.sample.json"),
            database_url=f"sqlite:///{database_path}",
            face_model="ArcFace",
            face_detector="retinaface",
            face_device="auto",
            location_precision_decimals=3,
            match_limit=5,
            max_upload_bytes=7_000_000,
            cors_origins=["*"],
            evidence_dir=evidence_dir,
            admin_password="correct horse",
            admin_session_secret="test-secret-with-enough-entropy",
        )
    )
    return TestClient(app), database_path, evidence_dir


def capture_payload(client_capture_id: str = "admin-capture-1") -> dict:
    return {
        "client_capture_id": client_capture_id,
        "captured_at": "2026-08-17T12:00:00Z",
        "uf": "SP",
        "city": "Sao Paulo",
        "latitude": -23.550519,
        "longitude": -46.633309,
        "selected_candidate_id": "sp-governor-10",
        "office": "governor",
        "candidate_matches": [],
    }


def jpeg_with_exif() -> bytes:
    output = BytesIO()
    image = Image.new("RGB", (2200, 1100), "yellow")
    exif = Image.Exif()
    exif[0x010E] = "private description"
    image.save(output, format="JPEG", exif=exif)
    return output.getvalue()


def login(client: TestClient) -> dict[str, str]:
    response = client.post("/admin/session", json={"password": "correct horse"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def create_capture_with_evidence(client: TestClient, client_capture_id: str = "admin-capture-1") -> str:
    response = client.post(
        "/captures/with-evidence",
        data={"payload": __import__("json").dumps(capture_payload(client_capture_id))},
        files={"file": ("street.jpg", jpeg_with_exif(), "image/jpeg")},
    )
    assert response.status_code == 200
    return response.json()["id"]


def test_admin_login_requires_valid_password_and_expires() -> None:
    authenticator = AdminAuthenticator("password", "secret", ttl_seconds=-1)
    session = authenticator.login("password")
    try:
        authenticator.verify(session.token)
    except AdminAuthError as exc:
        assert str(exc) == "Sessão expirada"
    else:
        raise AssertionError("Expired token was accepted")


def test_admin_login_is_rate_limited(tmp_path: Path) -> None:
    client, _, _ = make_client(tmp_path)
    for _ in range(5):
        assert client.post("/admin/session", json={"password": "wrong"}).status_code == 401
    assert client.post("/admin/session", json={"password": "wrong"}).status_code == 429


def test_evidence_upload_is_private_sanitized_and_idempotent(tmp_path: Path) -> None:
    client, database_path, evidence_dir = make_client(tmp_path)
    capture_id = create_capture_with_evidence(client)

    assert client.get(f"/admin/captures/{capture_id}/evidence").status_code == 401
    headers = login(client)
    response = client.get(f"/admin/captures/{capture_id}/evidence", headers=headers)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    with Image.open(BytesIO(response.content)) as image:
        assert image.size == (1920, 960)
        assert len(image.getexif()) == 0

    replacement_id = create_capture_with_evidence(client)
    assert replacement_id == capture_id
    assert len(list(evidence_dir.glob("*.jpg"))) == 1
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM captures").fetchone()[0] == 1


def test_invalid_evidence_does_not_create_capture(tmp_path: Path) -> None:
    client, database_path, _ = make_client(tmp_path)
    response = client.post(
        "/captures/with-evidence",
        data={"payload": __import__("json").dumps(capture_payload())},
        files={"file": ("not-a-photo.jpg", b"not a jpeg", "image/jpeg")},
    )
    assert response.status_code == 422
    with sqlite3.connect(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM captures").fetchone()[0] == 0


def test_admin_list_filters_and_marks_legacy_evidence_missing(tmp_path: Path) -> None:
    client, _, _ = make_client(tmp_path)
    assert client.post("/captures", json=capture_payload("legacy-capture")).status_code == 200
    create_capture_with_evidence(client, "photo-capture")
    headers = login(client)

    response = client.get("/admin/captures?uf=SP&office=governor&limit=25", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["summary"] == {"confirmed": 2, "rejected": 0, "without_evidence": 1}
    assert {entry["evidence_available"] for entry in body["entries"]} == {True, False}
    assert response.headers["cache-control"] == "no-store"


def test_invalidate_and_restore_updates_ranking_and_audit(tmp_path: Path) -> None:
    client, _, _ = make_client(tmp_path)
    capture_id = create_capture_with_evidence(client)
    headers = login(client)
    assert client.get("/rankings?uf=SP&office=governor").json()["entries"][0]["count"] == 1

    invalidated = client.patch(
        f"/admin/captures/{capture_id}/status",
        headers=headers,
        json={"status": "rejected", "reason": "Foto não mostra um santinho"},
    )
    assert invalidated.status_code == 200
    assert invalidated.json()["status"] == "rejected"
    assert client.get("/rankings?uf=SP&office=governor").json()["entries"] == []

    restored = client.patch(
        f"/admin/captures/{capture_id}/status",
        headers=headers,
        json={"status": "confirmed", "reason": "Revisão confirmou a evidência"},
    )
    assert restored.status_code == 200
    assert len(restored.json()["moderation_events"]) == 2
    assert client.get("/rankings?uf=SP&office=governor").json()["entries"][0]["count"] == 1
