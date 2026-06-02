from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from santinho_hunter_api.config import get_settings
from santinho_hunter_api.face.deepface_provider import DeepFaceProvider, DeepFaceUnavailableError
from santinho_hunter_api.face.matcher import rank_matches
from santinho_hunter_api.models import EmbeddingMatchRequest, HealthResponse, MatchResponse, Office
from santinho_hunter_api.storage import CandidateEmbeddingStore

settings = get_settings()
store = CandidateEmbeddingStore(settings.embeddings_path)
face_provider = DeepFaceProvider(
    model_name=settings.face_model,
    detector_backend=settings.face_detector,
    device_policy=settings.face_device,
)

app = FastAPI(title="Santinho Hunter API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    status = face_provider.status()

    return HealthResponse(
        ok=True,
        face_provider=status.provider,
        face_available=status.available,
        face_device=status.device,
        embeddings_count=store.count(),
    )


@app.post("/matches/embedding", response_model=MatchResponse)
def match_embedding(payload: EmbeddingMatchRequest) -> MatchResponse:
    matches = rank_matches(
        payload.embedding,
        store.all(),
        uf=payload.uf,
        office=payload.office,
        limit=payload.limit,
    )

    return MatchResponse(
        matches=matches,
        provider="precomputed_embedding",
    )


@app.post("/matches", response_model=MatchResponse)
async def match_image(
    uf: str,
    office: Office | None = None,
    file: UploadFile = File(...),
) -> MatchResponse:
    image_bytes = await file.read()

    if len(image_bytes) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="Image is too large")

    try:
        face_embeddings = face_provider.represent_image_bytes(image_bytes)
    except DeepFaceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if not face_embeddings:
        return MatchResponse(
            matches=[],
            provider=face_provider.provider_name,
            model=settings.face_model,
            detector=settings.face_detector,
            device=face_provider.status().device,
        )

    matches = rank_matches(
        face_embeddings[0].embedding,
        store.all(),
        uf=uf,
        office=office,
        limit=settings.match_limit,
    )

    return MatchResponse(
        matches=matches,
        provider=face_provider.provider_name,
        model=settings.face_model,
        detector=settings.face_detector,
        device=face_provider.status().device,
    )
