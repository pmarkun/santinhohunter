#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from santinho_hunter_api.tse.photos import write_photo_manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a JSONL manifest from a TSE candidate photo zip without extracting it."
    )
    parser.add_argument("zip_path", type=Path)
    parser.add_argument(
        "--candidate-csv",
        type=Path,
        default=None,
        help="Optional TSE consulta_cand CSV to enrich records by SQ_CANDIDATO.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/tse/photo_manifest.jsonl"),
    )
    parser.add_argument("--limit", type=int, default=None)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    count = write_photo_manifest(
        zip_path=args.zip_path,
        output_path=args.output,
        candidate_csv_path=args.candidate_csv,
        limit=args.limit,
    )
    print(f"Wrote {count} photo records to {args.output}")


if __name__ == "__main__":
    main()
