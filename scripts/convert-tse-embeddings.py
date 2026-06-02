#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from santinho_hunter_api.tse.embeddings import convert_tse_embedding_jsonl


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert generated TSE embedding JSONL into the API candidate embedding JSON format."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    count = convert_tse_embedding_jsonl(args.input, args.output)
    print(f"Wrote {count} API candidate embeddings to {args.output}")


if __name__ == "__main__":
    main()
