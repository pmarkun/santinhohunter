import json
from pathlib import Path
from zipfile import ZipFile

from santinho_hunter_api.tse.photos import iter_photo_entries, parse_photo_name, write_photo_manifest


def test_parse_photo_name_extracts_uf_and_candidate_sequence() -> None:
    assert parse_photo_name("FSP250002527932_div.jpg") == ("SP", "250002527932", "jpg")
    assert parse_photo_name("nested/FSP250002055330_div.jpeg") == ("SP", "250002055330", "jpeg")
    assert parse_photo_name("leiame.pdf") is None


def test_iter_photo_entries_skips_non_photo_files(tmp_path: Path) -> None:
    zip_path = tmp_path / "photos.zip"

    with ZipFile(zip_path, "w") as archive:
        archive.writestr("leiame.pdf", b"docs")
        archive.writestr("FSP250002527932_div.jpg", b"photo")

    entries = list(iter_photo_entries(zip_path))

    assert len(entries) == 1
    assert entries[0].candidate_sequence == "250002527932"
    assert entries[0].size_bytes == 5


def test_write_photo_manifest_can_join_candidate_csv(tmp_path: Path) -> None:
    zip_path = tmp_path / "photos.zip"
    csv_path = tmp_path / "consulta_cand.csv"
    output_path = tmp_path / "manifest.jsonl"

    with ZipFile(zip_path, "w") as archive:
        archive.writestr("FSP250002527932_div.jpg", b"photo")

    csv_path.write_text(
        "\n".join(
            [
                "SQ_CANDIDATO;NM_URNA_CANDIDATO;NR_CANDIDATO;SG_PARTIDO;DS_CARGO;SG_UF;NM_UE",
                "250002527932;FULANA DA PRAÇA;12345;PAPEL;VEREADOR;SP;SAO PAULO",
            ]
        ),
        encoding="latin-1",
    )

    count = write_photo_manifest(
        zip_path=zip_path,
        candidate_csv_path=csv_path,
        output_path=output_path,
    )
    record = json.loads(output_path.read_text(encoding="utf-8").strip())

    assert count == 1
    assert record["candidate_sequence"] == "250002527932"
    assert record["candidate"]["ballot_name"] == "FULANA DA PRAÇA"
