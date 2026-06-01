from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class FaceEmbedding:
    embedding: list[float]
    box: tuple[int, int, int, int] | None = None


@dataclass(frozen=True)
class FaceProviderStatus:
    provider: str
    available: bool
    device: str
    detail: str | None = None


class FaceProvider(Protocol):
    provider_name: str

    def status(self) -> FaceProviderStatus:
        """Return runtime availability and selected device."""

    def represent_image_bytes(self, image_bytes: bytes) -> list[FaceEmbedding]:
        """Extract face embeddings from raw image bytes."""
