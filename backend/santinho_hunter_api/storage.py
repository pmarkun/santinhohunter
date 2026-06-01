import json
from pathlib import Path

from santinho_hunter_api.models import CandidateEmbedding


class CandidateEmbeddingStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._cache: list[CandidateEmbedding] | None = None

    def all(self) -> list[CandidateEmbedding]:
        if self._cache is None:
            self._cache = self._load()

        return self._cache

    def count(self) -> int:
        return len(self.all())

    def _load(self) -> list[CandidateEmbedding]:
        if not self.path.exists():
            return []

        with self.path.open("r", encoding="utf-8") as file:
            raw = json.load(file)

        return [CandidateEmbedding.model_validate(item) for item in raw]
