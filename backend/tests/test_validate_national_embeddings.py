import importlib.util
import json
from pathlib import Path


SCRIPT_PATH = Path(__file__).parents[2] / "scripts" / "validate-national-embeddings.py"
SPEC = importlib.util.spec_from_file_location("validate_national_embeddings", SCRIPT_PATH)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def candidate(candidate_id: str, uf: str, office: str) -> dict[str, object]:
    return {
        "id": candidate_id,
        "uf": uf,
        "office": office,
    }


def embedding(candidate_id: str, uf: str, office: str) -> dict[str, object]:
    return {
        "candidate_id": candidate_id,
        "uf": uf,
        "office": office,
        "embedding": [0.1, 0.2, 0.3],
    }


def write_dataset(tmp_path: Path) -> tuple[Path, Path]:
    catalog_path = tmp_path / "catalog.json"
    embeddings_dir = tmp_path / "embeddings"
    embeddings_dir.mkdir()
    candidates = []
    for uf in MODULE.PARTITIONS:
        office = "president" if uf == "BR" else "governor"
        candidate_id = f"candidate-{uf}"
        candidates.append(candidate(candidate_id, uf, office))
        (embeddings_dir / f"{uf}.json").write_text(
            json.dumps([embedding(candidate_id, uf, office)]),
            encoding="utf-8",
        )
    catalog_path.write_text(json.dumps({"candidates": candidates}), encoding="utf-8")
    return catalog_path, embeddings_dir


def test_validate_accepts_complete_partitioned_dataset(tmp_path: Path) -> None:
    catalog_path, embeddings_dir = write_dataset(tmp_path)

    report = MODULE.validate(catalog_path, embeddings_dir)

    assert report["valid"] is True
    assert report["partitions"] == 28
    assert report["embeddings"] == 28
    assert report["dimensions"] == {3: 28}


def test_validate_rejects_candidate_in_wrong_partition(tmp_path: Path) -> None:
    catalog_path, embeddings_dir = write_dataset(tmp_path)
    (embeddings_dir / "SP.json").write_text(
        json.dumps([embedding("candidate-SP", "RJ", "governor")]),
        encoding="utf-8",
    )

    report = MODULE.validate(catalog_path, embeddings_dir)

    assert report["valid"] is False
    assert any("UF 'RJ' difere da particao" in error for error in report["errors"])
