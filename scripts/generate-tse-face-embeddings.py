#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
import tempfile
from zipfile import ZipFile


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from santinho_hunter_api.face.deepface_provider import DeepFaceProvider
from santinho_hunter_api.models import CandidateResponse
from santinho_hunter_api.tse.candidates import TSE_PHOTOS_URL, download
from santinho_hunter_api.tse.photos import parse_photo_name


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate DeepFace embeddings from official TSE candidate photo zips."
    )
    parser.add_argument(
        "--catalog",
        type=Path,
        default=Path("backend/data/candidates.tse-2026.json"),
    )
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=Path.home() / ".cache" / "santinhohunter" / "tse-2026",
    )
    parser.add_argument(
        "--output-jsonl",
        type=Path,
        default=Path("backend/data/tse/2026/face_embeddings.jsonl"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("backend/data/candidate_embeddings.tse-2026.json"),
    )
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--ufs", nargs="+", default=["SP", "BR"])
    parser.add_argument("--model", default=os.getenv("SANTINHO_FACE_MODEL", "ArcFace"))
    parser.add_argument("--detector", default=os.getenv("SANTINHO_FACE_DETECTOR", "retinaface"))
    parser.add_argument("--device", default=os.getenv("SANTINHO_FACE_DEVICE", "cpu"))
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--no-resume", action="store_true")
    parser.add_argument(
        "--compact-only",
        action="store_true",
        help="Only convert the incremental JSONL output to compact API JSON.",
    )
    return parser.parse_args()


def load_catalog(path: Path) -> dict[str, CandidateResponse]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    candidates = payload["candidates"] if isinstance(payload, dict) else payload
    return {
        candidate.id: candidate
        for candidate in (CandidateResponse.model_validate(item) for item in candidates)
    }


def load_done(output_jsonl: Path) -> set[str]:
    if not output_jsonl.exists():
        return set()

    done: set[str] = set()
    with output_jsonl.open("r", encoding="utf-8") as file:
        for line in file:
            if not line.strip():
                continue
            row = json.loads(line)
            done.add(str(row["candidate_sequence"]))

    return done


def write_compact_json(jsonl_path: Path, output_path: Path) -> int:
    embeddings = []
    with jsonl_path.open("r", encoding="utf-8") as file:
        for line in file:
            if not line.strip():
                continue
            row = json.loads(line)
            candidate = row["candidate"]
            embeddings.append(
                {
                    "candidate_id": row["candidate_sequence"],
                    "election_year": row["election_year"],
                    "uf": candidate["uf"],
                    "office": candidate["office"],
                    "number": candidate["number"],
                    "ballot_name": candidate["ballot_name"],
                    "party": candidate["party"],
                    "embedding": row["embedding"],
                }
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(embeddings, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(embeddings)


def main() -> None:
    args = parse_args()

    if args.compact_only:
        compact_count = write_compact_json(args.output_jsonl, args.output)
        print(f"wrote {compact_count} compact embeddings to {args.output}")
        return

    catalog = load_catalog(args.catalog)
    done = set() if args.no_resume else load_done(args.output_jsonl)
    args.output_jsonl.parent.mkdir(parents=True, exist_ok=True)

    provider = DeepFaceProvider(
        model_name=args.model,
        detector_backend=args.detector,
        device_policy=args.device,
    )
    print(
        f"provider={provider.provider_name} model={args.model} detector={args.detector} "
        f"device={provider.status().device} resume={len(done)}"
    )

    processed = 0
    written = 0
    skipped = 0
    failures = 0

    with args.output_jsonl.open("a", encoding="utf-8") as output_file:
        for uf in [item.strip().upper() for item in args.ufs]:
            photo_zip = download(
                TSE_PHOTOS_URL.format(year=args.year, uf=uf),
                args.cache_dir / "photos" / f"foto_cand{args.year}_{uf}_div.zip",
            )
            with ZipFile(photo_zip) as archive:
                for member in archive.namelist():
                    parsed = parse_photo_name(member)
                    if parsed is None:
                        continue

                    _, candidate_sequence, _ = parsed
                    candidate = catalog.get(candidate_sequence)
                    if candidate is None:
                        skipped += 1
                        continue

                    if candidate_sequence in done:
                        continue

                    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as image_file:
                        image_file.write(archive.read(member))
                        image_path = Path(image_file.name)

                    try:
                        image_bytes = image_path.read_bytes()
                        embeddings = provider.represent_image_bytes(image_bytes)
                    except Exception as exc:  # pragma: no cover - depends on image/model runtime
                        failures += 1
                        print(f"failed {candidate_sequence} {candidate.ballot_name}: {exc}", file=sys.stderr)
                    finally:
                        image_path.unlink(missing_ok=True)

                    processed += 1
                    if embeddings:
                        output_file.write(
                            json.dumps(
                                {
                                    "candidate_sequence": candidate_sequence,
                                    "election_year": candidate.election_year,
                                    "candidate": {
                                        "uf": candidate.uf,
                                        "office": candidate.office,
                                        "number": candidate.number,
                                        "ballot_name": candidate.ballot_name,
                                        "party": candidate.party,
                                    },
                                    "embedding": embeddings[0].embedding,
                                },
                                ensure_ascii=False,
                            )
                        )
                        output_file.write("\n")
                        output_file.flush()
                        done.add(candidate_sequence)
                        written += 1

                    if processed % 25 == 0:
                        print(f"processed={processed} written={written} skipped={skipped} failures={failures}")

                    if args.limit is not None and processed >= args.limit:
                        compact_count = write_compact_json(args.output_jsonl, args.output)
                        print(f"wrote {compact_count} compact embeddings to {args.output}")
                        return

    compact_count = write_compact_json(args.output_jsonl, args.output)
    print(
        f"done processed={processed} written={written} skipped={skipped} "
        f"failures={failures} compact={compact_count}"
    )


if __name__ == "__main__":
    main()
