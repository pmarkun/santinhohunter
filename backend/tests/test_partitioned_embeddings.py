import json
from pathlib import Path

from fastapi.testclient import TestClient

from santinho_hunter_api.config import Settings
from santinho_hunter_api.main import create_app
from santinho_hunter_api.storage import CandidateEmbeddingStore


def embedding(candidate_id: str, uf: str) -> dict[str, object]:
    return {
        "candidate_id": candidate_id,
        "election_year": 2026,
        "uf": uf,
        "office": "governor" if uf != "BR" else "president",
        "number": "10",
        "ballot_name": candidate_id,
        "party": "TEST",
        "embedding": [1.0, 0.0, 0.0],
    }


def write_partition(directory: Path, uf: str) -> None:
    candidates = [embedding(f"{uf.lower()}-candidate", uf)]
    (directory / f"{uf}.json").write_text(json.dumps(candidates), encoding="utf-8")


def test_partition_store_loads_only_requested_uf_and_presidency(tmp_path: Path) -> None:
    write_partition(tmp_path, "SP")
    write_partition(tmp_path, "RJ")
    write_partition(tmp_path, "BR")
    store = CandidateEmbeddingStore(tmp_path)

    assert {candidate.candidate_id for candidate in store.for_uf("SP")} == {
        "sp-candidate",
        "br-candidate",
    }
    assert {candidate.candidate_id for candidate in store.for_uf("RJ")} == {
        "rj-candidate",
        "br-candidate",
    }
    assert "rj-candidate" not in {candidate.candidate_id for candidate in store.for_uf("SP")}
    assert store.count() == 3


def test_partition_store_all_remains_available_for_admin_and_health(tmp_path: Path) -> None:
    write_partition(tmp_path, "SP")
    write_partition(tmp_path, "BR")
    store = CandidateEmbeddingStore(tmp_path)

    assert {candidate.uf for candidate in store.all()} == {"SP", "BR"}


def test_api_match_does_not_load_another_uf(tmp_path: Path) -> None:
    write_partition(tmp_path, "SP")
    write_partition(tmp_path, "RJ")
    write_partition(tmp_path, "BR")
    client = TestClient(
        create_app(
            Settings(
                embeddings_path=tmp_path,
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

    response = client.post(
        "/matches/embedding",
        json={"uf": "SP", "office": "governor", "embedding": [1.0, 0.0, 0.0]},
    )

    assert response.status_code == 200
    assert {match["candidate_id"] for match in response.json()["matches"]} == {
        "sp-candidate"
    }
