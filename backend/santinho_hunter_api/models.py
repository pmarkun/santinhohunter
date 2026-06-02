from typing import Literal

from pydantic import BaseModel, Field


Office = Literal[
    "president",
    "governor",
    "senator",
    "federal_deputy",
    "state_deputy",
    "district_deputy",
    "mayor",
    "vice_mayor",
    "councilor",
]


class CandidateEmbedding(BaseModel):
    candidate_id: str
    election_year: int
    uf: str
    office: Office
    number: str
    ballot_name: str
    party: str
    embedding: list[float] = Field(min_length=2)


class EmbeddingMatchRequest(BaseModel):
    uf: str
    office: Office | None = None
    embedding: list[float] = Field(min_length=2)
    limit: int = Field(default=5, ge=1, le=20)


class MatchCandidate(BaseModel):
    candidate_id: str
    ballot_name: str
    party: str
    number: str
    office: Office
    distance: float
    confidence: float


class MatchResponse(BaseModel):
    matches: list[MatchCandidate]
    provider: str
    model: str | None = None
    detector: str | None = None
    device: str | None = None


class HealthResponse(BaseModel):
    ok: bool
    face_provider: str
    face_available: bool
    face_device: str
    embeddings_count: int
