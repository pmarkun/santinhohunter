from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


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

VALID_UFS = {
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
    "BR",
}


def normalize_uf(value: str) -> str:
    normalized = value.strip().upper()
    if normalized not in VALID_UFS:
        raise ValueError("UF inválida")

    return normalized


class CandidateEmbedding(BaseModel):
    candidate_id: str
    election_year: int
    uf: str
    office: Office
    number: str
    ballot_name: str
    party: str
    embedding: list[float] = Field(min_length=2)

    @field_validator("uf")
    @classmethod
    def validate_uf(cls, value: str) -> str:
        return normalize_uf(value)


class CandidateResponse(BaseModel):
    id: str
    election_year: int
    uf: str
    office: Office
    number: str
    ballot_name: str
    full_name: str
    party: str
    photo_url: str | None = None


class EmbeddingMatchRequest(BaseModel):
    uf: str
    office: Office | None = None
    embedding: list[float] = Field(min_length=2)
    limit: int = Field(default=5, ge=1, le=20)

    @field_validator("uf")
    @classmethod
    def validate_uf(cls, value: str) -> str:
        return normalize_uf(value)


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


CaptureStatus = Literal["confirmed", "rejected"]
CaptureSource = Literal["app", "manual", "test"]
CaptureMatchType = Literal["face_vector", "number_search", "manual_selection", "ocr_number"]


class CaptureMatchInput(BaseModel):
    candidate_id: str
    confidence: float = Field(ge=0, le=1)
    match_type: CaptureMatchType
    rank: int = Field(ge=1)


class CaptureCreateRequest(BaseModel):
    client_capture_id: str = Field(min_length=1)
    captured_at: datetime
    uf: str
    city: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    accuracy: float | None = Field(default=None, ge=0)
    selected_candidate_id: str
    office: Office
    candidate_matches: list[CaptureMatchInput] = Field(default_factory=list)
    status: CaptureStatus = "confirmed"
    source: CaptureSource = "app"

    @field_validator("uf")
    @classmethod
    def validate_uf(cls, value: str) -> str:
        normalized = normalize_uf(value)
        if normalized == "BR":
            raise ValueError("UF deve ser estadual")

        return normalized


class CaptureCreateResponse(BaseModel):
    id: str
    sync_status: Literal["synced"]


class RankingEntryResponse(BaseModel):
    candidate: CandidateResponse
    count: int
    last_capture_at: datetime


class RankingResponse(BaseModel):
    uf: str
    office: Office
    updated_at: datetime
    entries: list[RankingEntryResponse]


class CandidateSearchResponse(BaseModel):
    candidates: list[CandidateResponse]


class HealthResponse(BaseModel):
    ok: bool
    face_provider: str
    face_available: bool
    face_device: str
    embeddings_count: int
