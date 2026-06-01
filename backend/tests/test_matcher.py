import pytest

from santinho_hunter_api.face.matcher import cosine_distance, rank_matches
from santinho_hunter_api.models import CandidateEmbedding


def test_cosine_distance_orders_similar_vectors() -> None:
    assert cosine_distance([1, 0, 0], [1, 0, 0]) == pytest.approx(0)
    assert cosine_distance([1, 0, 0], [0, 1, 0]) == pytest.approx(1)


def test_rank_matches_filters_by_uf_and_office() -> None:
    candidates = [
        CandidateEmbedding(
            candidate_id="sp-1",
            election_year=2022,
            uf="SP",
            office="governor",
            number="10",
            ballot_name="Pessoa SP",
            party="AAA",
            embedding=[1, 0, 0],
        ),
        CandidateEmbedding(
            candidate_id="rj-1",
            election_year=2022,
            uf="RJ",
            office="governor",
            number="10",
            ballot_name="Pessoa RJ",
            party="BBB",
            embedding=[1, 0, 0],
        ),
        CandidateEmbedding(
            candidate_id="br-1",
            election_year=2022,
            uf="BR",
            office="president",
            number="13",
            ballot_name="Pessoa BR",
            party="CCC",
            embedding=[0, 1, 0],
        ),
    ]

    matches = rank_matches(
        [0.95, 0.05, 0],
        candidates,
        uf="SP",
        office="governor",
        limit=3,
    )

    assert [match.candidate_id for match in matches] == ["sp-1"]
