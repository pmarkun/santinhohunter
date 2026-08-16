#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from santinho_hunter_api.tse.candidates import TSE_CANDIDATES_URL, TSE_PHOTOS_URL, download, write_candidate_catalog
from santinho_hunter_api.tse.photos import write_photo_manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download official TSE 2026 candidate data and build Santinho Hunter catalog files."
    )
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--ufs", nargs="+", default=["SP"], help="UFs to import, for example: SP RJ")
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=Path.home() / ".cache" / "santinhohunter" / "tse-2026",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/candidates.tse-2026.json"),
    )
    parser.add_argument(
        "--photos-dir",
        type=Path,
        default=Path("backend/data/tse/2026/photos"),
    )
    parser.add_argument("--skip-photos", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.cache_dir.mkdir(parents=True, exist_ok=True)
    ufs = [uf.strip().upper() for uf in args.ufs]

    candidates_zip = download(
        TSE_CANDIDATES_URL.format(year=args.year),
        args.cache_dir / f"consulta_cand_{args.year}.zip",
    )
    count = write_candidate_catalog(
        candidates_zip_path=candidates_zip,
        output_path=args.output,
        year=args.year,
        ufs=ufs,
    )
    print(f"Wrote {count} candidates to {args.output}")

    if args.skip_photos:
        return

    for uf in [*ufs, "BR"]:
        photo_zip = download(
            TSE_PHOTOS_URL.format(year=args.year, uf=uf),
            args.cache_dir / "photos" / f"foto_cand{args.year}_{uf}_div.zip",
        )
        output = args.photos_dir / uf / "photo_manifest.jsonl"
        photo_count = write_photo_manifest(
            zip_path=photo_zip,
            candidate_csv_path=candidates_zip,
            output_path=output,
        )
        print(f"Wrote {photo_count} {uf} photo records to {output}")


if __name__ == "__main__":
    main()
