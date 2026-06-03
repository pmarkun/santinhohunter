from datetime import UTC, datetime

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from santinho_hunter_api.capture_store import CaptureStore
from santinho_hunter_api.config import Settings, get_settings
from santinho_hunter_api.face.deepface_provider import DeepFaceProvider, DeepFaceUnavailableError
from santinho_hunter_api.face.matcher import rank_matches
from santinho_hunter_api.models import (
    CandidateSearchResponse,
    CaptureCreateRequest,
    CaptureCreateResponse,
    EmbeddingMatchRequest,
    HealthResponse,
    MatchResponse,
    Office,
    RankingEntryResponse,
    RankingResponse,
    normalize_uf,
)
from santinho_hunter_api.storage import CandidateEmbeddingStore


def create_app(app_settings: Settings | None = None) -> FastAPI:
    settings = app_settings or get_settings()
    store = CandidateEmbeddingStore(settings.embeddings_path)
    capture_store = CaptureStore(settings.database_url, settings.location_precision_decimals)
    capture_store.ensure_schema()
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

    @app.get("/candidates/search", response_model=CandidateSearchResponse)
    def search_candidates(
        uf: str,
        number: str,
        office: Office | None = None,
    ) -> CandidateSearchResponse:
        try:
            candidates = store.search(uf=uf, number=number, office=office)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        return CandidateSearchResponse(candidates=candidates)

    @app.post("/captures", response_model=CaptureCreateResponse)
    def create_capture(payload: CaptureCreateRequest) -> CaptureCreateResponse:
        try:
            capture_id = capture_store.create_capture(payload, store)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        return CaptureCreateResponse(id=capture_id, sync_status="synced")

    @app.get("/rankings", response_model=RankingResponse)
    def rankings(
        uf: str = Query(min_length=2, max_length=2),
        office: Office = Query(),
    ) -> RankingResponse:
        try:
            normalized_uf = normalize_uf(uf)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        rows = capture_store.ranking(normalized_uf, office)
        entries = []
        for row in rows:
            candidate = store.find(row.candidate_id)
            if not candidate:
                continue

            entries.append(
                RankingEntryResponse(
                    candidate=store.to_response(candidate),
                    count=row.count,
                    last_capture_at=row.last_capture_at,
                )
            )

        return RankingResponse(
            uf=normalized_uf,
            office=office,
            updated_at=datetime.now(UTC),
            entries=entries,
        )

    return app


app = create_app()
