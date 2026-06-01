from fastapi.testclient import TestClient

from santinho_hunter_api.main import app


def test_health_returns_embedding_count() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["embeddings_count"] >= 1


def test_match_embedding_returns_ranked_candidates() -> None:
    client = TestClient(app)

    response = client.post(
        "/matches/embedding",
        json={
            "uf": "SP",
            "office": "governor",
            "embedding": [0.95, 0.05, 0.1, 0.0],
            "limit": 2,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "precomputed_embedding"
    assert body["matches"][0]["candidate_id"] == "sp-governor-10"
