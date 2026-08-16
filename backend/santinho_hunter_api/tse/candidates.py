from __future__ import annotations

import csv
import io
import json
import ssl
import urllib.request
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable
from zipfile import ZipFile

from santinho_hunter_api.models import CandidateResponse
from santinho_hunter_api.tse.embeddings import office_from_tse_label


TSE_CANDIDATES_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_{year}.zip"
TSE_PHOTOS_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/foto_cand/foto_cand{year}_{uf}_div.zip"
GENERAL_ELECTION_OFFICES = {
    "PRESIDENTE",
    "GOVERNADOR",
    "SENADOR",
    "DEPUTADO FEDERAL",
    "DEPUTADO ESTADUAL",
    "DEPUTADO DISTRITAL",
}


def download(url: str, destination: Path) -> Path:
    if destination.exists() and destination.stat().st_size:
        return destination

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    ca_file = next(
        (
            path
            for path in (
                Path("/etc/ssl/certs/ca-bundle.crt"),
                Path("/etc/ssl/certs/ca-certificates.crt"),
            )
            if path.exists()
        ),
        None,
    )
    ssl_context = ssl.create_default_context(cafile=str(ca_file) if ca_file else None)

    with urllib.request.urlopen(url, context=ssl_context) as response, temporary.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)

    temporary.replace(destination)
    return destination


def candidate_csv_member(year: int, uf: str) -> str:
    suffix = "BRASIL" if uf == "BRASIL" else uf
    return f"consulta_cand_{year}_{suffix}.csv"


def rows_from_zip(zip_path: Path, member_name: str) -> Iterable[dict[str, str]]:
    with ZipFile(zip_path) as archive:
        with archive.open(member_name) as raw:
            text = io.TextIOWrapper(raw, encoding="latin-1", newline="")
            yield from csv.DictReader(text, delimiter=";", quotechar='"')


def clean_tse_value(value: str | None) -> str:
    if value is None:
        return ""

    stripped = value.strip()
    return "" if stripped in {"#NE", "#NULO"} else stripped


def candidate_from_tse_row(row: dict[str, str]) -> CandidateResponse | None:
    office_label = clean_tse_value(row.get("DS_CARGO"))
    if office_label not in GENERAL_ELECTION_OFFICES:
        return None

    uf = "BR" if office_label == "PRESIDENTE" else clean_tse_value(row.get("SG_UF"))
    return CandidateResponse(
        id=clean_tse_value(row.get("SQ_CANDIDATO")),
        election_year=int(clean_tse_value(row.get("ANO_ELEICAO"))),
        uf=uf,
        office=office_from_tse_label(office_label),
        number=clean_tse_value(row.get("NR_CANDIDATO")),
        ballot_name=clean_tse_value(row.get("NM_URNA_CANDIDATO")),
        full_name=clean_tse_value(row.get("NM_CANDIDATO")).title(),
        party=clean_tse_value(row.get("SG_PARTIDO")),
    )


def build_candidate_catalog(
    *,
    candidates_zip_path: Path,
    year: int,
    ufs: Iterable[str],
) -> dict[str, object]:
    requested_ufs = {uf.strip().upper() for uf in ufs}
    if not requested_ufs:
        raise ValueError("At least one UF is required")

    members = sorted(requested_ufs)
    if "BR" not in members:
        members.append("BRASIL")

    candidates_by_id: dict[str, CandidateResponse] = {}
    with ZipFile(candidates_zip_path) as archive:
        existing_members = set(archive.namelist())

    for uf in members:
        member_name = candidate_csv_member(year, uf)
        if member_name not in existing_members:
            raise FileNotFoundError(f"No ZIP member {member_name!r} in {candidates_zip_path}")

        for row in rows_from_zip(candidates_zip_path, member_name):
            if clean_tse_value(row.get("NR_TURNO")) != "1":
                continue

            candidate = candidate_from_tse_row(row)
            if candidate is None:
                continue

            if candidate.uf != "BR" and candidate.uf not in requested_ufs:
                continue

            candidates_by_id[candidate.id] = candidate

    candidates = sorted(
        candidates_by_id.values(),
        key=lambda candidate: (candidate.uf, candidate.office, candidate.number, candidate.ballot_name),
    )
    by_uf = Counter(candidate.uf for candidate in candidates)
    by_office = Counter(candidate.office for candidate in candidates)

    return {
        "metadata": {
            "source": "Tribunal Superior Eleitoral",
            "source_url": TSE_CANDIDATES_URL.format(year=year),
            "year": year,
            "ufs": sorted(requested_ufs),
            "generated_at": datetime.now(UTC).isoformat(),
            "count": len(candidates),
            "by_uf": dict(sorted(by_uf.items())),
            "by_office": dict(sorted(by_office.items())),
        },
        "candidates": [candidate.model_dump() for candidate in candidates],
    }


def write_candidate_catalog(
    *,
    candidates_zip_path: Path,
    output_path: Path,
    year: int,
    ufs: Iterable[str],
) -> int:
    catalog = build_candidate_catalog(candidates_zip_path=candidates_zip_path, year=year, ufs=ufs)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return int(catalog["metadata"]["count"])  # type: ignore[index]
