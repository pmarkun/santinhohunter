#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


STATE_UFS = (
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MG",
    "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR",
    "RS", "SC", "SE", "SP", "TO",
)
PARTITIONS = ("BR", *STATE_UFS)


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as file:
        return json.load(file)


def validate(catalog_path: Path, embeddings_dir: Path) -> dict[str, Any]:
    catalog_document = load_json(catalog_path)
    catalog_items = catalog_document.get("candidates", catalog_document)
    catalog = {str(item["id"]): item for item in catalog_items}
    errors: list[str] = []
    dimensions: Counter[int] = Counter()
    counts: dict[str, int] = {}
    seen_ids: set[str] = set()

    actual_partitions = {path.stem for path in embeddings_dir.glob("*.json")}
    missing = set(PARTITIONS) - actual_partitions
    unexpected = actual_partitions - set(PARTITIONS)
    if missing:
        errors.append(f"particoes ausentes: {', '.join(sorted(missing))}")
    if unexpected:
        errors.append(f"particoes inesperadas: {', '.join(sorted(unexpected))}")

    for partition in PARTITIONS:
        path = embeddings_dir / f"{partition}.json"
        if not path.exists():
            continue
        items = load_json(path)
        if not isinstance(items, list):
            errors.append(f"{partition}: raiz do JSON nao e uma lista")
            continue
        counts[partition] = len(items)
        if not items:
            errors.append(f"{partition}: particao vazia")

        for index, item in enumerate(items):
            label = f"{partition}[{index}]"
            candidate_id = str(item.get("candidate_id", ""))
            if not candidate_id:
                errors.append(f"{label}: candidate_id ausente")
                continue
            if candidate_id in seen_ids:
                errors.append(f"{label}: candidate_id duplicado {candidate_id}")
            seen_ids.add(candidate_id)

            if item.get("uf") != partition:
                errors.append(f"{label}: UF {item.get('uf')!r} difere da particao")
            if partition == "BR" and item.get("office") != "president":
                errors.append(f"{label}: BR contem cargo {item.get('office')!r}")
            if partition != "BR" and item.get("office") == "president":
                errors.append(f"{label}: Presidencia fora de BR")

            candidate = catalog.get(candidate_id)
            if candidate is None:
                errors.append(f"{label}: candidato nao existe no catalogo")
            elif candidate.get("uf") != partition:
                errors.append(f"{label}: catalogo aponta UF {candidate.get('uf')!r}")

            embedding = item.get("embedding")
            if not isinstance(embedding, list) or not embedding:
                errors.append(f"{label}: embedding ausente ou vazio")
            else:
                dimensions[len(embedding)] += 1
                if not all(isinstance(value, (int, float)) for value in embedding):
                    errors.append(f"{label}: embedding contem valor nao numerico")

    if len(dimensions) > 1:
        errors.append(f"dimensoes inconsistentes: {dict(dimensions)}")

    return {
        "valid": not errors,
        "partitions": len(counts),
        "embeddings": sum(counts.values()),
        "dimensions": dict(dimensions),
        "counts": counts,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida os embeddings nacionais particionados.")
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path("backend/data/candidates.tse-2026.json"),
    )
    parser.add_argument(
        "--embeddings-dir",
        type=Path,
        default=Path("backend/data/embeddings/2026"),
    )
    args = parser.parse_args()

    report = validate(args.catalog, args.embeddings_dir)
    print(json.dumps(report, ensure_ascii=True, indent=2))
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
