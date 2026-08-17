from math import sqrt

import numpy as np

from santinho_hunter_api.models import CandidateEmbedding, MatchCandidate, Office


def cosine_distance(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        raise ValueError("Embeddings must have the same dimension")

    dot = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = sqrt(sum(a * a for a in left))
    right_norm = sqrt(sum(b * b for b in right))

    if left_norm == 0 or right_norm == 0:
        raise ValueError("Embeddings cannot be zero vectors")

    return 1 - dot / (left_norm * right_norm)


def confidence_from_distance(distance: float) -> float:
    return max(0.0, min(1.0, 1.0 - distance))


def rank_matches(
    query_embedding: list[float],
    candidates: list[CandidateEmbedding],
    *,
    uf: str,
    office: Office | None,
    limit: int,
) -> list[MatchCandidate]:
    return CandidateMatcher(candidates).rank(
        query_embedding,
        uf=uf,
        office=office,
        limit=limit,
    )


class CandidateMatcher:
    def __init__(self, candidates: list[CandidateEmbedding]) -> None:
        self._candidates = candidates
        if not candidates:
            self._normalized_embeddings = np.empty((0, 0), dtype=np.float32)
            return

        embeddings = np.asarray([candidate.embedding for candidate in candidates], dtype=np.float32)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        if np.any(norms == 0):
            raise ValueError("Embeddings cannot be zero vectors")
        self._normalized_embeddings = embeddings / norms

    def rank(
        self,
        query_embedding: list[float],
        *,
        uf: str,
        office: Office | None,
        limit: int,
    ) -> list[MatchCandidate]:
        indexes = np.asarray(
            [
                index
                for index, candidate in enumerate(self._candidates)
                if candidate.uf in {uf, "BR"}
                and (office is None or candidate.office == office)
            ],
            dtype=np.intp,
        )
        if indexes.size == 0:
            return []

        query = np.asarray(query_embedding, dtype=np.float32)
        if query.shape != (self._normalized_embeddings.shape[1],):
            raise ValueError("Embeddings must have the same dimension")
        query_norm = np.linalg.norm(query)
        if query_norm == 0:
            raise ValueError("Embeddings cannot be zero vectors")

        distances = 1 - self._normalized_embeddings[indexes] @ (query / query_norm)
        ordered_positions = np.argsort(distances)[:limit]
        scored = [
            (float(distances[position]), self._candidates[indexes[position]])
            for position in ordered_positions
        ]

        return [
            MatchCandidate(
                candidate_id=candidate.candidate_id,
                election_year=candidate.election_year,
                ballot_name=candidate.ballot_name,
                party=candidate.party,
                number=candidate.number,
                office=candidate.office,
                distance=distance,
                confidence=confidence_from_distance(distance),
            )
            for distance, candidate in scored
        ]
