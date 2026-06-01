from math import sqrt

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
    filtered = [
        candidate
        for candidate in candidates
        if candidate.uf in {uf, "BR"} and (office is None or candidate.office == office)
    ]

    scored = sorted(
        (
            (
                cosine_distance(query_embedding, candidate.embedding),
                candidate,
            )
            for candidate in filtered
        ),
        key=lambda item: item[0],
    )

    return [
        MatchCandidate(
            candidate_id=candidate.candidate_id,
            ballot_name=candidate.ballot_name,
            party=candidate.party,
            number=candidate.number,
            office=candidate.office,
            distance=distance,
            confidence=confidence_from_distance(distance),
        )
        for distance, candidate in scored[:limit]
    ]
