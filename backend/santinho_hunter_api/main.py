from contextlib import asynccontextmanager
from datetime import UTC, datetime
from io import BytesIO
from time import perf_counter
from threading import BoundedSemaphore

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from PIL import Image

from santinho_hunter_api.candidate_photos import CandidatePhotoStore
from santinho_hunter_api.admin_auth import AdminAuthenticator, AdminAuthError, LoginRateLimiter
from santinho_hunter_api.capture_store import CaptureStore
from santinho_hunter_api.config import Settings, get_settings
from santinho_hunter_api.face.deepface_provider import DeepFaceProvider, DeepFaceUnavailableError
from santinho_hunter_api.face.matcher import CandidateMatcher
from santinho_hunter_api.evidence_store import EvidenceStore, InvalidEvidenceError
from santinho_hunter_api.models import (
    AdminCaptureCandidate,
    AdminCaptureListResponse,
    AdminCaptureResponse,
    AdminCaptureSummary,
    AdminLoginRequest,
    AdminModerationEvent,
    AdminSessionResponse,
    AdminStatusUpdateRequest,
    CandidateSearchResponse,
    CaptureCreateRequest,
    CaptureCreateResponse,
    CandidateResponse,
    EmbeddingMatchRequest,
    FaceBoundingBox,
    FaceMatchGroup,
    HealthResponse,
    MatchResponse,
    MatchCandidate,
    Office,
    RankingEntryResponse,
    RankingResponse,
    normalize_uf,
)
from santinho_hunter_api.storage import CandidateEmbeddingStore


def create_app(app_settings: Settings | None = None) -> FastAPI:
    settings = app_settings or get_settings()
    store = CandidateEmbeddingStore(settings.embeddings_path, settings.candidate_catalog_path)
    photo_store = CandidatePhotoStore(settings.candidate_photo_archives)
    candidates_with_photos = [
        candidate for candidate in store.all() if photo_store.has(candidate.candidate_id)
    ]
    match_candidates = candidates_with_photos or store.all()
    matcher = CandidateMatcher(match_candidates)
    capture_store = CaptureStore(settings.database_url, settings.location_precision_decimals)
    capture_store.ensure_schema()
    evidence_store = EvidenceStore(
        settings.evidence_dir,
        max_upload_bytes=settings.max_upload_bytes,
    )
    admin_auth = AdminAuthenticator(
        settings.admin_password,
        settings.admin_session_secret,
        settings.admin_session_ttl_seconds,
    )
    login_limiter = LoginRateLimiter()
    face_provider = DeepFaceProvider(
        model_name=settings.face_model,
        detector_backend=settings.face_detector,
        device_policy=settings.face_device,
    )
    face_queue = BoundedSemaphore(1)
    warmup_photo = photo_store.first()

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        try:
            await run_in_threadpool(
                face_provider.warm_up,
                warmup_photo.content if warmup_photo else None,
            )
        except DeepFaceUnavailableError:
            # The lightweight local backend intentionally works without DeepFace installed.
            pass
        yield

    def analyze_queued(image_bytes: bytes):
        queue_started_at = perf_counter()
        with face_queue:
            queue_ms = _elapsed_ms(queue_started_at)
            return face_provider.analyze_image_bytes(image_bytes), queue_ms

    app = FastAPI(title="Santinho Hunter API", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Server-Timing"],
    )

    @app.middleware("http")
    async def protect_admin_cache(request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/admin"):
            response.headers["Cache-Control"] = "no-store"
        return response

    def require_admin(request: Request) -> None:
        authorization = request.headers.get("authorization", "")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(status_code=401, detail="Sessão administrativa necessária")
        try:
            admin_auth.verify(token)
        except AdminAuthError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

    def admin_capture_response(capture_id: str, *, include_events: bool) -> AdminCaptureResponse:
        row = capture_store.get_admin_capture(capture_id)
        if not row:
            raise HTTPException(status_code=404, detail="Flagra não encontrado")
        candidates = []
        for candidate_id, _office, face_id, selection_type, confidence in capture_store.capture_candidates(capture_id):
            candidate = store.find_response(str(candidate_id))
            if candidate:
                candidates.append(
                    AdminCaptureCandidate(
                        candidate=candidate,
                        face_id=str(face_id) if face_id else None,
                        selection_type=str(selection_type),
                        confidence=float(confidence) if confidence is not None else None,
                    )
                )
        events = (
            [
                AdminModerationEvent(
                    id=event.id,
                    previous_status=event.previous_status,
                    new_status=event.new_status,
                    reason=event.reason,
                    created_at=event.created_at,
                )
                for event in capture_store.moderation_events(capture_id)
            ]
            if include_events
            else []
        )
        return AdminCaptureResponse(
            id=row.id,
            client_capture_id=row.client_capture_id,
            captured_at=row.captured_at,
            created_at=row.created_at,
            uf=row.uf,
            city=row.city,
            latitude_approx=row.latitude_approx,
            longitude_approx=row.longitude_approx,
            accuracy=row.accuracy,
            status=row.status,
            source=row.source,
            evidence_available=bool(row.evidence_filename),
            evidence_mime_type=row.evidence_mime_type,
            evidence_size_bytes=row.evidence_size_bytes,
            candidates=candidates,
            moderation_events=events,
        )

    @app.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        status = face_provider.status()

        return HealthResponse(
            ok=True,
            face_provider=status.provider,
            face_available=status.available,
            face_device=status.device,
            embeddings_count=len(match_candidates),
        )

    @app.post("/matches/embedding", response_model=MatchResponse)
    def match_embedding(payload: EmbeddingMatchRequest, request: Request) -> MatchResponse:
        matches = _matches_with_photos(
            matcher.rank(
                payload.embedding,
                uf=payload.uf,
                office=payload.office,
                limit=payload.limit,
            ),
            request,
            photo_store,
        )

        return MatchResponse(
            matches=matches,
            provider="precomputed_embedding",
        )

    @app.post("/matches", response_model=MatchResponse)
    async def match_image(
        request: Request,
        response: Response,
        uf: str,
        office: Office | None = None,
        file: UploadFile = File(...),
    ) -> MatchResponse:
        total_started_at = perf_counter()
        read_started_at = perf_counter()
        image_bytes = await file.read()
        read_ms = _elapsed_ms(read_started_at)

        if len(image_bytes) > settings.max_upload_bytes:
            raise HTTPException(status_code=413, detail="Image is too large")

        try:
            analysis, queue_ms = await run_in_threadpool(analyze_queued, image_bytes)
        except DeepFaceUnavailableError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        if not analysis.faces:
            result = MatchResponse(
                matches=[],
                provider=face_provider.provider_name,
                model=settings.face_model,
                detector=settings.face_detector,
                device=face_provider.status().device,
            )
            _set_server_timing(
                response,
                read_ms=read_ms,
                queue_ms=queue_ms,
                detection_ms=analysis.detection_ms,
                embedding_ms=analysis.embedding_ms,
                ranking_ms=0,
                total_ms=_elapsed_ms(total_started_at),
            )
            return result

        image_size = _read_image_size(image_bytes)
        ranking_started_at = perf_counter()
        faces = []
        for index, face_embedding in enumerate(analysis.faces):
            face_matches = _matches_with_photos(
                matcher.rank(
                    face_embedding.embedding,
                    uf=uf,
                    office=office,
                    limit=settings.match_limit,
                ),
                request,
                photo_store,
            )
            faces.append(
                FaceMatchGroup(
                    face_id=f"face-{index}",
                    bounding_box=_normalize_face_box(face_embedding.box, image_size),
                    matches=face_matches,
                )
            )
        ranking_ms = _elapsed_ms(ranking_started_at)

        result = MatchResponse(
            matches=faces[0].matches,
            faces=faces,
            provider=face_provider.provider_name,
            model=settings.face_model,
            detector=settings.face_detector,
            device=face_provider.status().device,
        )
        _set_server_timing(
            response,
            read_ms=read_ms,
            queue_ms=queue_ms,
            detection_ms=analysis.detection_ms,
            embedding_ms=analysis.embedding_ms,
            ranking_ms=ranking_ms,
            total_ms=_elapsed_ms(total_started_at),
        )
        return result

    @app.get("/candidates/search", response_model=CandidateSearchResponse)
    def search_candidates(
        request: Request,
        uf: str,
        number: str,
        office: Office | None = None,
    ) -> CandidateSearchResponse:
        try:
            candidates = store.search(uf=uf, number=number, office=office)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        return CandidateSearchResponse(
            candidates=[_candidate_with_photo(candidate, request, photo_store) for candidate in candidates]
        )

    @app.get("/candidate-photos/{candidate_id}", name="candidate_photo")
    def candidate_photo(candidate_id: str) -> Response:
        photo = photo_store.read(candidate_id)
        if photo is None:
            raise HTTPException(status_code=404, detail="Candidate photo not found")
        return Response(
            content=photo.content,
            media_type=photo.media_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    @app.post("/captures", response_model=CaptureCreateResponse)
    def create_capture(payload: CaptureCreateRequest) -> CaptureCreateResponse:
        try:
            capture_id = capture_store.create_capture(payload, store)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        return CaptureCreateResponse(id=capture_id, sync_status="synced")

    @app.post("/captures/with-evidence", response_model=CaptureCreateResponse)
    async def create_capture_with_evidence(
        payload: str = Form(...),
        file: UploadFile = File(...),
    ) -> CaptureCreateResponse:
        try:
            capture_payload = CaptureCreateRequest.model_validate_json(payload)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Payload de captura inválido") from exc

        image_bytes = await file.read(settings.max_upload_bytes + 1)
        previous_filename = capture_store.evidence_filename_for_client_capture(
            capture_payload.client_capture_id
        )
        try:
            evidence = evidence_store.save(image_bytes)
        except InvalidEvidenceError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        try:
            capture_id = capture_store.create_capture(capture_payload, store, evidence)
        except ValueError as exc:
            evidence_store.delete(evidence.filename)
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception:
            evidence_store.delete(evidence.filename)
            raise

        if previous_filename and previous_filename != evidence.filename:
            evidence_store.delete(previous_filename)
        return CaptureCreateResponse(id=capture_id, sync_status="synced")

    @app.post("/admin/session", response_model=AdminSessionResponse)
    def create_admin_session(payload: AdminLoginRequest, request: Request) -> AdminSessionResponse:
        client_ip = request.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        client_ip = client_ip or (request.client.host if request.client else "unknown")
        if not login_limiter.check(client_ip):
            raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde 15 minutos.")
        try:
            session = admin_auth.login(payload.password)
        except AdminAuthError as exc:
            login_limiter.fail(client_ip)
            status_code = 503 if not admin_auth.configured else 401
            raise HTTPException(status_code=status_code, detail=str(exc)) from exc
        login_limiter.clear(client_ip)
        return AdminSessionResponse(token=session.token, expires_at=session.expires_at)

    @app.post("/admin/session/logout", status_code=204)
    def logout_admin(request: Request) -> Response:
        require_admin(request)
        return Response(status_code=204)

    @app.get("/admin/captures", response_model=AdminCaptureListResponse)
    def list_admin_captures(
        request: Request,
        status: str | None = Query(default=None, pattern="^(confirmed|rejected)$"),
        uf: str | None = Query(default=None, min_length=2, max_length=2),
        office: Office | None = Query(default=None),
        candidate_id: str | None = Query(default=None, alias="candidateId"),
        date_from: datetime | None = Query(default=None, alias="from"),
        date_to: datetime | None = Query(default=None, alias="to"),
        query: str | None = Query(default=None, max_length=100),
        limit: int = Query(default=25, ge=1, le=100),
        offset: int = Query(default=0, ge=0),
    ) -> AdminCaptureListResponse:
        require_admin(request)
        normalized_uf = normalize_uf(uf) if uf else None
        total, rows = capture_store.list_admin_captures(
            status=status,
            uf=normalized_uf,
            office=office,
            candidate_id=candidate_id,
            date_from=date_from,
            date_to=date_to,
            query=query.strip() if query else None,
            limit=limit,
            offset=offset,
        )
        confirmed, rejected, without_evidence = capture_store.admin_summary()
        return AdminCaptureListResponse(
            summary=AdminCaptureSummary(
                confirmed=confirmed,
                rejected=rejected,
                without_evidence=without_evidence,
            ),
            total=total,
            entries=[admin_capture_response(row.id, include_events=False) for row in rows],
        )

    @app.get("/admin/captures/{capture_id}", response_model=AdminCaptureResponse)
    def get_admin_capture(capture_id: str, request: Request) -> AdminCaptureResponse:
        require_admin(request)
        return admin_capture_response(capture_id, include_events=True)

    @app.get("/admin/captures/{capture_id}/evidence")
    def get_admin_evidence(capture_id: str, request: Request) -> Response:
        require_admin(request)
        row = capture_store.get_admin_capture(capture_id)
        if not row:
            raise HTTPException(status_code=404, detail="Flagra não encontrado")
        if not row.evidence_filename:
            raise HTTPException(status_code=404, detail="Evidência indisponível")
        content = evidence_store.read(row.evidence_filename)
        if content is None:
            raise HTTPException(status_code=404, detail="Evidência indisponível")
        return Response(content=content, media_type=row.evidence_mime_type or "image/jpeg")

    @app.patch("/admin/captures/{capture_id}/status", response_model=AdminCaptureResponse)
    def update_admin_capture_status(
        capture_id: str,
        payload: AdminStatusUpdateRequest,
        request: Request,
    ) -> AdminCaptureResponse:
        require_admin(request)
        if not capture_store.update_status(capture_id, payload.status, payload.reason):
            raise HTTPException(status_code=404, detail="Flagra não encontrado")
        return admin_capture_response(capture_id, include_events=True)

    @app.get("/rankings", response_model=RankingResponse)
    def rankings(
        request: Request,
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
            candidate = store.find_response(row.candidate_id)
            if not candidate:
                continue

            entries.append(
                RankingEntryResponse(
                    candidate=_candidate_with_photo(candidate, request, photo_store),
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


def _candidate_with_photo(
    candidate: CandidateResponse,
    request: Request,
    photo_store: CandidatePhotoStore,
) -> CandidateResponse:
    if not photo_store.has(candidate.id):
        return candidate
    return candidate.model_copy(
        update={"photo_url": _candidate_photo_url(request, candidate.id)}
    )


def _matches_with_photos(
    matches: list[MatchCandidate],
    request: Request,
    photo_store: CandidatePhotoStore,
) -> list[MatchCandidate]:
    return [
        match.model_copy(
            update={
                "photo_url": _candidate_photo_url(request, match.candidate_id)
            }
        )
        if photo_store.has(match.candidate_id)
        else match
        for match in matches
    ]


def _candidate_photo_url(request: Request, candidate_id: str) -> str:
    url = request.url_for("candidate_photo", candidate_id=candidate_id)
    forwarded_proto = request.headers.get("x-forwarded-proto")
    if forwarded_proto in {"http", "https"}:
        url = url.replace(scheme=forwarded_proto)
    return str(url)


def _read_image_size(image_bytes: bytes) -> tuple[int, int] | None:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            return image.size
    except Exception:
        return None


def _normalize_face_box(
    box: tuple[int, int, int, int] | None,
    image_size: tuple[int, int] | None,
) -> FaceBoundingBox | None:
    if not box or not image_size:
        return None

    x, y, width, height = box
    image_width, image_height = image_size
    if image_width <= 0 or image_height <= 0:
        return None

    return FaceBoundingBox(
        x=max(0, min(1, x / image_width)),
        y=max(0, min(1, y / image_height)),
        width=max(0, min(1, width / image_width)),
        height=max(0, min(1, height / image_height)),
    )


def _elapsed_ms(started_at: float) -> float:
    return (perf_counter() - started_at) * 1000


def _set_server_timing(
    response: Response,
    *,
    read_ms: float,
    queue_ms: float,
    detection_ms: float,
    embedding_ms: float,
    ranking_ms: float,
    total_ms: float,
) -> None:
    metrics = (
        ("read", read_ms),
        ("queue", queue_ms),
        ("detect", detection_ms),
        ("embed", embedding_ms),
        ("rank", ranking_ms),
        ("total", total_ms),
    )
    response.headers["Server-Timing"] = ", ".join(
        f"{name};dur={duration:.1f}" for name, duration in metrics
    )
