import json
from pathlib import Path

from santinho_hunter_api.models import CandidateEmbedding, CandidateResponse, Office, normalize_uf


class CandidateEmbeddingStore:
    def __init__(self, path: Path, candidate_catalog_path: Path | None = None) -> None:
        self.path = path
        self.candidate_catalog_path = candidate_catalog_path
        self._cache: list[CandidateEmbedding] | None = None
        self._catalog_cache: list[CandidateResponse] | None = None

    def all(self) -> list[CandidateEmbedding]:
        if self._cache is None:
            self._cache = self._load()

        return self._cache

    def count(self) -> int:
        return len(self.all())

    def find(self, candidate_id: str) -> CandidateEmbedding | None:
        return next(
            (candidate for candidate in self.all() if candidate.candidate_id == candidate_id),
            None,
        )

    def find_response(self, candidate_id: str) -> CandidateResponse | None:
        return next(
            (candidate for candidate in self.catalog() if candidate.id == candidate_id),
            None,
        ) or (
            self.to_response(embedding)
            if (embedding := self.find(candidate_id)) is not None
            else None
        )

    def search(self, uf: str, number: str, office: Office | None = None) -> list[CandidateResponse]:
        normalized_uf = normalize_uf(uf)
        query = "".join(character for character in number if character.isdigit())
        if not query:
            return []

        catalog = self.catalog()
        if catalog:
            return [
                candidate
                for candidate in catalog
                if candidate.number.startswith(query)
                and candidate.uf in {normalized_uf, "BR"}
                and (office is None or candidate.office == office)
            ]

        return [
            self.to_response(candidate)
            for candidate in self.all()
            if candidate.number.startswith(query)
            and candidate.uf in {normalized_uf, "BR"}
            and (office is None or candidate.office == office)
        ]

    def to_response(self, candidate: CandidateEmbedding) -> CandidateResponse:
        return CandidateResponse(
            id=candidate.candidate_id,
            election_year=candidate.election_year,
            uf=candidate.uf,
            office=candidate.office,
            number=candidate.number,
            ballot_name=candidate.ballot_name,
            full_name=candidate.ballot_name,
            party=candidate.party,
        )

    def _load(self) -> list[CandidateEmbedding]:
        if not self.path.exists():
            return []

        with self.path.open("r", encoding="utf-8") as file:
            raw = json.load(file)

        return [CandidateEmbedding.model_validate(item) for item in raw]

    def catalog(self) -> list[CandidateResponse]:
        if self._catalog_cache is None:
            self._catalog_cache = self._load_catalog()

        return self._catalog_cache

    def _load_catalog(self) -> list[CandidateResponse]:
        if self.candidate_catalog_path is None or not self.candidate_catalog_path.exists():
            return []

        with self.candidate_catalog_path.open("r", encoding="utf-8") as file:
            raw = json.load(file)

        if isinstance(raw, dict):
            raw_candidates = raw.get("candidates", [])
        else:
            raw_candidates = raw

        return [CandidateResponse.model_validate(item) for item in raw_candidates]
