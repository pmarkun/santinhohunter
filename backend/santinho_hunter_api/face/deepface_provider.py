from pathlib import Path
import os
import tempfile
from time import perf_counter
from typing import Any

from santinho_hunter_api.face.provider import FaceAnalysis, FaceEmbedding, FaceProviderStatus


class DeepFaceUnavailableError(RuntimeError):
    """Raised when DeepFace or its runtime dependencies are not installed."""


class DeepFaceProvider:
    provider_name = "deepface"

    def __init__(self, *, model_name: str, detector_backend: str, device_policy: str) -> None:
        self.model_name = model_name
        self.detector_backend = detector_backend
        self.device_policy = device_policy
        self._deepface: Any | None = None
        self._device: str | None = None
        self._load_error: str | None = None

        if self.device_policy == "cpu":
            os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

    def status(self) -> FaceProviderStatus:
        try:
            self._ensure_loaded()
        except DeepFaceUnavailableError as exc:
            return FaceProviderStatus(
                provider=self.provider_name,
                available=False,
                device="unavailable",
                detail=str(exc),
            )

        return FaceProviderStatus(
            provider=self.provider_name,
            available=True,
            device=self._device or "unknown",
        )

    def represent_image_bytes(self, image_bytes: bytes) -> list[FaceEmbedding]:
        return self.analyze_image_bytes(image_bytes).faces

    def analyze_image_bytes(self, image_bytes: bytes) -> FaceAnalysis:
        self._ensure_loaded()

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as image_file:
            image_file.write(image_bytes)
            image_path = Path(image_file.name)

        try:
            detection_started_at = perf_counter()
            try:
                detected_faces = self._deepface.extract_faces(
                    img_path=str(image_path),
                    detector_backend=self.detector_backend,
                    enforce_detection=True,
                    align=True,
                )
            except ValueError as exc:
                if not self._is_no_face_error(exc):
                    raise
                detected_faces = []
            detection_ms = (perf_counter() - detection_started_at) * 1000

            embedding_started_at = perf_counter()
            faces = [self._represent_detected_face(face) for face in detected_faces]
            embedding_ms = (perf_counter() - embedding_started_at) * 1000
        finally:
            image_path.unlink(missing_ok=True)

        return FaceAnalysis(
            faces=faces,
            detection_ms=detection_ms,
            embedding_ms=embedding_ms,
        )

    def warm_up(self, sample_image_bytes: bytes | None = None) -> None:
        self._ensure_loaded()
        self._deepface.build_model(self.model_name)
        if sample_image_bytes:
            self.analyze_image_bytes(sample_image_bytes)

    def _ensure_loaded(self) -> None:
        if self._deepface is not None:
            return

        try:
            from deepface import DeepFace  # type: ignore
        except Exception as exc:  # pragma: no cover - depends on optional runtime
            self._load_error = str(exc)
            raise DeepFaceUnavailableError(
                "DeepFace is not installed in this environment. Install backend[deepface]."
            ) from exc

        self._deepface = DeepFace
        self._device = self._detect_device()

        if self.device_policy == "gpu" and self._device != "gpu":
            raise DeepFaceUnavailableError("GPU requested but TensorFlow did not report a GPU.")

    def _detect_device(self) -> str:
        try:
            import tensorflow as tf  # type: ignore

            return "gpu" if tf.config.list_physical_devices("GPU") else "cpu"
        except Exception:
            return "unknown"

    @staticmethod
    def _is_no_face_error(error: ValueError) -> bool:
        message = str(error).lower()
        return "face could not be detected" in message or "face cannot be detected" in message

    def _represent_detected_face(self, detected_face: dict[str, Any]) -> FaceEmbedding:
        face_image = detected_face["face"][:, :, ::-1]
        representations = self._deepface.represent(
            img_path=face_image,
            model_name=self.model_name,
            detector_backend="skip",
            enforce_detection=True,
            align=False,
        )
        representation = representations[0]
        region = detected_face.get("facial_area") or {}
        box = None

        if {"x", "y", "w", "h"}.issubset(region):
            box = (
                int(region["x"]),
                int(region["y"]),
                int(region["w"]),
                int(region["h"]),
            )

        return FaceEmbedding(
            embedding=[float(value) for value in representation["embedding"]],
            box=box,
        )
