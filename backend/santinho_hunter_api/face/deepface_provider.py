from pathlib import Path
import os
import tempfile
from typing import Any

from santinho_hunter_api.face.provider import FaceEmbedding, FaceProviderStatus


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
        self._ensure_loaded()

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as image_file:
            image_file.write(image_bytes)
            image_path = Path(image_file.name)

        try:
            representations = self._deepface.represent(
                img_path=str(image_path),
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=False,
                align=True,
            )
        finally:
            image_path.unlink(missing_ok=True)

        return [self._to_face_embedding(item) for item in representations]

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
    def _to_face_embedding(representation: dict[str, Any]) -> FaceEmbedding:
        region = representation.get("facial_area") or {}
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
