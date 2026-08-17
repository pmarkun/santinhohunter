from io import BytesIO
import json
from pathlib import Path
from zipfile import ZipFile

from fastapi.testclient import TestClient
from PIL import Image

from santinho_hunter_api.candidate_photos import CandidatePhotoStore
from santinho_hunter_api.config import Settings
from santinho_hunter_api.main import create_app


def test_candidate_photo_store_indexes_and_reads_tse_archives(tmp_path: Path) -> None:
    archive_path = tmp_path / "foto_cand2026_SP_div.zip"
    image_buffer = BytesIO()
    image = Image.new("RGB", (80, 100), "yellow")
    for x in range(40, 80):
        for y in range(100):
            image.putpixel((x, y), (0, 40, 180))
    image.save(image_buffer, format="JPEG")

    with ZipFile(archive_path, "w") as archive:
        archive.writestr("nested/FSP250002532324_div.jpg", image_buffer.getvalue())
        archive.writestr("leiame.txt", "ignored")

    store = CandidatePhotoStore((archive_path,))
    photo = store.read("250002532324")

    assert store.count() == 1
    assert store.has("250002532324") is True
    assert photo is not None
    assert photo.media_type == "image/jpeg"
    assert photo.content == image_buffer.getvalue()
    assert store.read("missing") is None


def test_candidate_photo_store_ignores_blank_tse_placeholders(tmp_path: Path) -> None:
    archive_path = tmp_path / "foto_cand2026_SP_div.zip"
    image_buffer = BytesIO()
    Image.new("RGB", (80, 100), "#BDBDBD").save(image_buffer, format="JPEG")

    with ZipFile(archive_path, "w") as archive:
        archive.writestr("FSP250002547459_div.jpg", image_buffer.getvalue())

    store = CandidatePhotoStore((archive_path,))

    assert store.count() == 0
    assert store.has("250002547459") is False


def test_match_response_links_to_served_candidate_photo(tmp_path: Path) -> None:
    candidate_id = "250002532324"
    archive_path = tmp_path / "foto_cand2026_SP_div.zip"
    image_buffer = BytesIO()
    image = Image.new("RGB", (80, 100), "white")
    for x in range(40, 80):
        for y in range(100):
            image.putpixel((x, y), (20, 80, 160))
    image.save(image_buffer, format="JPEG")
    with ZipFile(archive_path, "w") as archive:
        archive.writestr(f"FSP{candidate_id}_div.jpg", image_buffer.getvalue())

    embeddings_path = tmp_path / "embeddings.json"
    embeddings_path.write_text(
        json.dumps(
            [
                {
                    "candidate_id": candidate_id,
                    "election_year": 2026,
                    "uf": "SP",
                    "office": "federal_deputy",
                    "number": "1144",
                    "ballot_name": "CANDIDATO COM FOTO",
                    "party": "ABC",
                    "embedding": [1.0, 0.0],
                }
            ]
        ),
        encoding="utf-8",
    )
    client = TestClient(
        create_app(
            Settings(
                embeddings_path=embeddings_path,
                database_url=f"sqlite:///{tmp_path / 'captures.sqlite3'}",
                face_model="ArcFace",
                face_detector="retinaface",
                face_device="auto",
                location_precision_decimals=3,
                match_limit=5,
                max_upload_bytes=7000000,
                cors_origins=["*"],
                candidate_photo_archives=(archive_path,),
            )
        )
    )

    response = client.post(
        "/matches/embedding",
        json={"uf": "SP", "embedding": [1.0, 0.0], "limit": 1},
    )

    photo_url = response.json()["matches"][0]["photo_url"]
    assert photo_url == f"http://testserver/candidate-photos/{candidate_id}"
    photo_response = client.get(photo_url)
    assert photo_response.status_code == 200
    assert photo_response.headers["content-type"] == "image/jpeg"
    assert photo_response.content == image_buffer.getvalue()


def test_candidate_photo_link_uses_forwarded_https_scheme(tmp_path: Path) -> None:
    candidate_id = "250002532324"
    archive_path = tmp_path / "foto_cand2026_SP_div.zip"
    image_buffer = BytesIO()
    image = Image.new("RGB", (80, 100), "yellow")
    for x in range(40, 80):
        for y in range(100):
            image.putpixel((x, y), (20, 80, 160))
    image.save(image_buffer, format="JPEG")
    with ZipFile(archive_path, "w") as archive:
        archive.writestr(f"FSP{candidate_id}_div.jpg", image_buffer.getvalue())

    embeddings_path = tmp_path / "embeddings.json"
    embeddings_path.write_text(
        json.dumps(
            [
                {
                    "candidate_id": candidate_id,
                    "election_year": 2026,
                    "uf": "SP",
                    "office": "federal_deputy",
                    "number": "1144",
                    "ballot_name": "CANDIDATO COM FOTO",
                    "party": "ABC",
                    "embedding": [1.0, 0.0],
                }
            ]
        ),
        encoding="utf-8",
    )
    client = TestClient(
        create_app(
            Settings(
                embeddings_path=embeddings_path,
                database_url=f"sqlite:///{tmp_path / 'captures.sqlite3'}",
                face_model="ArcFace",
                face_detector="retinaface",
                face_device="auto",
                location_precision_decimals=3,
                match_limit=5,
                max_upload_bytes=7000000,
                cors_origins=["*"],
                candidate_photo_archives=(archive_path,),
            )
        )
    )

    response = client.post(
        "/matches/embedding",
        headers={"x-forwarded-proto": "https"},
        json={"uf": "SP", "embedding": [1.0, 0.0], "limit": 1},
    )

    assert response.json()["matches"][0]["photo_url"] == (
        f"https://testserver/candidate-photos/{candidate_id}"
    )
