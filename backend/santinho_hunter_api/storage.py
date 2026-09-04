import json
from pathlib import Path

from santinho_hunter_api.models import CandidateEmbedding, CandidateResponse, Office, normalize_uf


class CandidateEmbeddingStore:
    def __init__(self, path: Path, candidate_catalog_path: Path | None = None) -> None:
        self.path = path
        self.candidate_catalog_path = candidate_catalog_path
        self._cache: list[CandidateEmbedding] | None = None
        self._partition_cache: dict[str, list[CandidateEmbedding]] = {}
        self._catalog_cache: list[CandidateResponse] | None = None

    def all(self) -> list[CandidateEmbedding]:
        if self.path.is_dir():
            return [
                candidate
                for partition in self.partition_names()
                for candidate in self._load_partition(partition)
            ]

        if self._cache is None:
            self._cache = self._load()

        return self._cache

    def count(self) -> int:
        if self.path.is_dir():
            return sum(len(self._load_partition(uf)) for uf in self.partition_names())
        return len(self.all())

    def partition_names(self) -> list[str]:
        if not self.path.is_dir():
            return []
        return sorted(path.stem for path in self.path.glob("*.json"))

    def for_uf(self, uf: str) -> list[CandidateEmbedding]:
        normalized_uf = normalize_uf(uf)
        if not self.path.is_dir():
            return [
                candidate
                for candidate in self.all()
                if candidate.uf in {normalized_uf, "BR"}
            ]

        candidates = list(self._load_partition(normalized_uf))
        if normalized_uf != "BR":
            candidates += self._load_partition("BR")
        return candidates

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

    def _load_partition(self, partition: str) -> list[CandidateEmbedding]:
        normalized_partition = partition.strip().upper()
        if normalized_partition in self._partition_cache:
            return self._partition_cache[normalized_partition]

        path = self.path / f"{normalized_partition}.json"
        if not path.exists():
            self._partition_cache[normalized_partition] = []
            return []

        with path.open("r", encoding="utf-8") as file:
            raw = json.load(file)

        candidates = [CandidateEmbedding.model_validate(item) for item in raw]
        self._partition_cache[normalized_partition] = candidates
        return candidates

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
