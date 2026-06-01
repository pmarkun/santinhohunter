from __future__ import annotations

from dataclasses import dataclass
import csv
import json
from pathlib import Path
import re
from typing import Iterable
from zipfile import ZipFile


PHOTO_NAME_PATTERN = re.compile(r"^F(?P<uf>[A-Z]{2})(?P<sequence>\d+)_div\.(?P<ext>jpe?g)$", re.IGNORECASE)


@dataclass(frozen=True)
class TSEPhotoEntry:
    archive_name: str
    uf: str
    candidate_sequence: str
    extension: str
    size_bytes: int

    def to_dict(self) -> dict[str, str | int]:
        return {
            "archive_name": self.archive_name,
            "uf": self.uf,
            "candidate_sequence": self.candidate_sequence,
            "extension": self.extension,
            "size_bytes": self.size_bytes,
        }


def parse_photo_name(archive_name: str) -> tuple[str, str, str] | None:
    name = Path(archive_name).name
    match = PHOTO_NAME_PATTERN.match(name)

    if match is None:
        return None

    return (
        match.group("uf").upper(),
        match.group("sequence"),
        match.group("ext").lower(),
    )


def iter_photo_entries(zip_path: Path) -> Iterable[TSEPhotoEntry]:
    with ZipFile(zip_path) as archive:
        for item in archive.infolist():
            parsed = parse_photo_name(item.filename)

            if parsed is None:
                continue

            uf, candidate_sequence, extension = parsed
            yield TSEPhotoEntry(
                archive_name=item.filename,
                uf=uf,
                candidate_sequence=candidate_sequence,
                extension=extension,
                size_bytes=item.file_size,
            )


def load_candidate_csv(csv_path: Path) -> dict[str, dict[str, str]]:
    with csv_path.open("r", encoding="latin-1", newline="") as file:
        sample = file.read(4096)
        file.seek(0)
        delimiter = ";" if sample.count(";") >= sample.count(",") else ","
        reader = csv.DictReader(file, delimiter=delimiter)

        candidates: dict[str, dict[str, str]] = {}
        for row in reader:
            sequence = row.get("SQ_CANDIDATO")

            if not sequence:
                continue

            candidates[sequence] = {
                "candidate_sequence": sequence,
                "ballot_name": row.get("NM_URNA_CANDIDATO", ""),
                "number": row.get("NR_CANDIDATO", ""),
                "party": row.get("SG_PARTIDO", ""),
                "office_label": row.get("DS_CARGO", ""),
                "uf": row.get("SG_UF", ""),
                "city": row.get("NM_UE", ""),
            }

    return candidates


def write_photo_manifest(
    *,
    zip_path: Path,
    output_path: Path,
    candidate_csv_path: Path | None = None,
    limit: int | None = None,
) -> int:
    candidates = load_candidate_csv(candidate_csv_path) if candidate_csv_path else {}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    written = 0

    with output_path.open("w", encoding="utf-8") as file:
        for entry in iter_photo_entries(zip_path):
            record = entry.to_dict()
            candidate = candidates.get(entry.candidate_sequence)

            if candidate:
                record["candidate"] = candidate

            file.write(json.dumps(record, ensure_ascii=False, sort_keys=True))
            file.write("\n")
            written += 1

            if limit is not None and written >= limit:
                break

    return written
