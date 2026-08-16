from datetime import datetime
from typing import Literal, Self

from pydantic import BaseModel, Field, field_validator, model_validator


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
    election_year: int
    ballot_name: str
    party: str
    number: str
    office: Office
    distance: float
    confidence: float


class FaceBoundingBox(BaseModel):
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    width: float = Field(ge=0, le=1)
    height: float = Field(ge=0, le=1)


class FaceMatchGroup(BaseModel):
    face_id: str
    bounding_box: FaceBoundingBox | None = None
    matches: list[MatchCandidate]


class MatchResponse(BaseModel):
    matches: list[MatchCandidate]
    faces: list[FaceMatchGroup] = Field(default_factory=list)
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


class CaptureCandidateSelectionInput(BaseModel):
    candidate_id: str
    office: Office
    face_id: str | None = None
    selection_type: CaptureMatchType
    confidence: float | None = Field(default=None, ge=0, le=1)


class CaptureCreateRequest(BaseModel):
    client_capture_id: str = Field(min_length=1)
    captured_at: datetime
    uf: str
    city: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    accuracy: float | None = Field(default=None, ge=0)
    selected_candidate_id: str | None = None
    office: Office | None = None
    selected_candidates: list[CaptureCandidateSelectionInput] = Field(default_factory=list)
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

    @model_validator(mode="after")
    def validate_candidate_selection(self) -> Self:
        has_legacy_selection = bool(self.selected_candidate_id and self.office)
        if not has_legacy_selection and not self.selected_candidates:
            raise ValueError("Captura deve ter ao menos um candidato selecionado")
        if bool(self.selected_candidate_id) != bool(self.office):
            raise ValueError("Candidato e cargo legados devem ser enviados juntos")

        return self


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
