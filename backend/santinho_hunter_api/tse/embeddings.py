from __future__ import annotations

import json
from pathlib import Path

from santinho_hunter_api.models import CandidateEmbedding, Office


OFFICE_BY_TSE_LABEL: dict[str, Office] = {
    "PREFEITO": "mayor",
    "VICE-PREFEITO": "vice_mayor",
    "VEREADOR": "councilor",
    "PRESIDENTE": "president",
    "GOVERNADOR": "governor",
    "SENADOR": "senator",
    "DEPUTADO FEDERAL": "federal_deputy",
    "DEPUTADO ESTADUAL": "state_deputy",
    "DEPUTADO DISTRITAL": "district_deputy",
}


def office_from_tse_label(label: str) -> Office:
    normalized = label.strip().upper()

    if normalized not in OFFICE_BY_TSE_LABEL:
        raise ValueError(f"Unsupported TSE office label: {label}")

    return OFFICE_BY_TSE_LABEL[normalized]


def convert_tse_embedding_jsonl(input_path: Path, output_path: Path) -> int:
    embeddings: list[CandidateEmbedding] = []

    with input_path.open("r", encoding="utf-8") as file:
        for line in file:
            row = json.loads(line)
            candidate = row["candidate"]
            embeddings.append(
                CandidateEmbedding(
                    candidate_id=row["candidate_sequence"],
                    election_year=2024,
                    uf=candidate["uf"],
                    office=office_from_tse_label(candidate["office_label"]),
                    number=candidate["number"],
                    ballot_name=candidate["ballot_name"],
                    party=candidate["party"],
                    embedding=row["embedding"],
                )
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump([embedding.model_dump() for embedding in embeddings], file, ensure_ascii=False)
        file.write("\n")

    return len(embeddings)
