import json
from pathlib import Path

from santinho_hunter_api.tse.embeddings import convert_tse_embedding_jsonl, office_from_tse_label


def test_office_from_tse_label_maps_municipal_offices() -> None:
    assert office_from_tse_label("PREFEITO") == "mayor"
    assert office_from_tse_label("VICE-PREFEITO") == "vice_mayor"
    assert office_from_tse_label("VEREADOR") == "councilor"


def test_convert_tse_embedding_jsonl_writes_api_format(tmp_path: Path) -> None:
    input_path = tmp_path / "embeddings.jsonl"
    output_path = tmp_path / "candidate_embeddings.json"
    input_path.write_text(
        json.dumps(
            {
                "candidate_sequence": "250002052120",
                "candidate": {
                    "uf": "SP",
                    "office_label": "VEREADOR",
                    "number": "18888",
                    "ballot_name": "PEDRO DA IA",
                    "party": "REDE",
                },
                "embedding": [0.1, 0.2],
            },
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )

    count = convert_tse_embedding_jsonl(input_path, output_path)
    records = json.loads(output_path.read_text(encoding="utf-8"))

    assert count == 1
    assert records[0] == {
        "candidate_id": "250002052120",
        "election_year": 2024,
        "uf": "SP",
        "office": "councilor",
        "number": "18888",
        "ballot_name": "PEDRO DA IA",
        "party": "REDE",
        "embedding": [0.1, 0.2],
    }
