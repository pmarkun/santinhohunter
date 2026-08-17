#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass
from io import BytesIO
import json
from pathlib import Path
from statistics import mean
import sys
from time import perf_counter
from zipfile import ZipFile

from PIL import Image, ImageDraw


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from santinho_hunter_api.candidate_photos import is_placeholder_photo
from santinho_hunter_api.face.deepface_provider import DeepFaceProvider
from santinho_hunter_api.tse.photos import parse_photo_name


@dataclass(frozen=True)
class BenchmarkResult:
    detector: str
    expected_faces: int
    detected_faces: int
    detection_ms: float
    embedding_ms: float
    total_ms: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Compare DeepFace detectors on santinho-like collages.")
    parser.add_argument(
        "--archives",
        nargs="+",
        type=Path,
        default=[
            Path("backend/data/foto_cand2026_SP_div.zip"),
            Path("backend/data/foto_cand2026_BR_div.zip"),
        ],
    )
    parser.add_argument("--detectors", nargs="+", default=["retinaface", "yunet"])
    parser.add_argument("--variants", type=int, default=4)
    parser.add_argument("--repeats", type=int, default=2)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--device", default="auto")
    return parser.parse_args()


def load_candidate_photos(archives: list[Path], limit: int = 16) -> list[Image.Image]:
    photos: list[Image.Image] = []
    for archive_path in archives:
        with ZipFile(archive_path) as archive:
            for name in archive.namelist():
                if parse_photo_name(name) is None:
                    continue
                content = archive.read(name)
                if is_placeholder_photo(content):
                    continue
                with Image.open(BytesIO(content)) as image:
                    photos.append(image.convert("RGB").copy())
                if len(photos) >= limit:
                    return photos
    return photos


def make_collage(photos: list[Image.Image], faces: int, variant: int) -> bytes:
    canvas = Image.new("RGB", (1920, 1080), (235, 232, 220))
    columns = 1 if faces == 1 else 2
    rows = (faces + columns - 1) // columns
    cell_width = canvas.width // columns
    cell_height = canvas.height // rows
    for index in range(faces):
        source = photos[(variant * 4 + index) % len(photos)].copy()
        source.thumbnail((int(cell_width * 0.72), int(cell_height * 0.78)))
        angle = (-7, 4, -3, 8)[(index + variant) % 4]
        source = source.rotate(angle, expand=True, fillcolor=(235, 232, 220))
        x = (index % columns) * cell_width + (cell_width - source.width) // 2
        y = (index // columns) * cell_height + (cell_height - source.height) // 2
        canvas.paste(source, (x, y))
    return encode_jpeg(canvas)


def make_negative(variant: int) -> bytes:
    canvas = Image.new("RGB", (1920, 1080), (225, 225, 220))
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((180, 160, 1740, 920), fill=(245, 204, 45), outline=(25, 25, 25), width=12)
    draw.text((260, 430), f"SANTINHO SEM ROSTO {variant + 1}", fill=(20, 20, 20))
    return encode_jpeg(canvas)


def encode_jpeg(image: Image.Image) -> bytes:
    output = BytesIO()
    image.save(output, format="JPEG", quality=76)
    return output.getvalue()


def percentile_95(values: list[float]) -> float:
    ordered = sorted(values)
    return ordered[max(0, int(len(ordered) * 0.95) - 1)]


def run_benchmark(args: argparse.Namespace) -> dict:
    photos = load_candidate_photos(args.archives)
    if len(photos) < 4:
        raise RuntimeError("At least four valid candidate photos are required")

    cases = [
        (faces, make_collage(photos, faces, variant))
        for faces in (1, 2, 4)
        for variant in range(args.variants)
    ] + [(0, make_negative(variant)) for variant in range(args.variants)]
    results: list[BenchmarkResult] = []

    for detector in args.detectors:
        provider = DeepFaceProvider(
            model_name="ArcFace",
            detector_backend=detector,
            device_policy=args.device,
        )
        provider.warm_up(cases[0][1])
        for _repeat in range(args.repeats):
            for expected_faces, image_bytes in cases:
                started_at = perf_counter()
                analysis = provider.analyze_image_bytes(image_bytes)
                results.append(
                    BenchmarkResult(
                        detector=detector,
                        expected_faces=expected_faces,
                        detected_faces=len(analysis.faces),
                        detection_ms=round(analysis.detection_ms, 1),
                        embedding_ms=round(analysis.embedding_ms, 1),
                        total_ms=round((perf_counter() - started_at) * 1000, 1),
                    )
                )

    summaries = {}
    for detector in args.detectors:
        detector_results = [result for result in results if result.detector == detector]
        positives = [result for result in detector_results if result.expected_faces > 0]
        expected = sum(result.expected_faces for result in positives)
        found = sum(min(result.expected_faces, result.detected_faces) for result in positives)
        false_positive_cases = sum(
            result.detected_faces > 0
            for result in detector_results
            if result.expected_faces == 0
        )
        summaries[detector] = {
            "face_recall": round(found / expected, 4),
            "false_positive_cases": false_positive_cases,
            "mean_detection_ms": round(mean(result.detection_ms for result in detector_results), 1),
            "p95_detection_ms": round(
                percentile_95([result.detection_ms for result in detector_results]), 1
            ),
            "p95_total_ms": round(percentile_95([result.total_ms for result in detector_results]), 1),
        }

    retinaface = summaries.get("retinaface")
    yunet = summaries.get("yunet")
    adopt_yunet = bool(
        retinaface
        and yunet
        and yunet["face_recall"] >= retinaface["face_recall"] * 0.95
        and yunet["p95_detection_ms"] <= retinaface["p95_detection_ms"] * 0.6
        and yunet["false_positive_cases"] == 0
    )
    return {
        "cases_per_detector": len(cases) * args.repeats,
        "summaries": summaries,
        "recommendation": "yunet" if adopt_yunet else "retinaface",
        "results": [asdict(result) for result in results],
    }


def main() -> None:
    args = parse_args()
    report = run_benchmark(args)
    serialized = json.dumps(report, indent=2)
    print(serialized)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
