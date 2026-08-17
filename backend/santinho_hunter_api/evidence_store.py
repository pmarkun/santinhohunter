from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
import os
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageOps, UnidentifiedImageError


@dataclass(frozen=True)
class StoredEvidence:
    filename: str
    mime_type: str
    size_bytes: int
    sha256: str


class InvalidEvidenceError(ValueError):
    pass


class EvidenceStore:
    def __init__(
        self,
        root: Path,
        *,
        max_upload_bytes: int,
        max_pixels: int = 25_000_000,
        max_dimension: int = 1920,
    ) -> None:
        self.root = root
        self.max_upload_bytes = max_upload_bytes
        self.max_pixels = max_pixels
        self.max_dimension = max_dimension

    def save(self, content: bytes) -> StoredEvidence:
        if not content or len(content) > self.max_upload_bytes:
            raise InvalidEvidenceError("Evidência vazia ou maior que o limite permitido")

        sanitized = self._sanitize(content)
        filename = f"{uuid4()}.jpg"
        temporary = self.root / f".{filename}.tmp"
        destination = self.root / filename
        self.root.mkdir(parents=True, exist_ok=True)
        try:
            temporary.write_bytes(sanitized)
            os.replace(temporary, destination)
        finally:
            temporary.unlink(missing_ok=True)

        return StoredEvidence(
            filename=filename,
            mime_type="image/jpeg",
            size_bytes=len(sanitized),
            sha256=sha256(sanitized).hexdigest(),
        )

    def read(self, filename: str) -> bytes | None:
        path = self._safe_path(filename)
        return path.read_bytes() if path.is_file() else None

    def delete(self, filename: str | None) -> None:
        if filename:
            self._safe_path(filename).unlink(missing_ok=True)

    def _sanitize(self, content: bytes) -> bytes:
        try:
            with Image.open(BytesIO(content)) as source:
                if source.format != "JPEG":
                    raise InvalidEvidenceError("A evidência deve ser uma imagem JPEG")
                width, height = source.size
                if width <= 0 or height <= 0 or width * height > self.max_pixels:
                    raise InvalidEvidenceError("A evidência excede as dimensões permitidas")
                image = ImageOps.exif_transpose(source).convert("RGB")
                image.thumbnail((self.max_dimension, self.max_dimension), Image.Resampling.LANCZOS)
                output = BytesIO()
                image.save(output, format="JPEG", quality=80, optimize=True)
                return output.getvalue()
        except (InvalidEvidenceError, Image.DecompressionBombError):
            raise
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise InvalidEvidenceError("Não foi possível ler a evidência JPEG") from exc

    def _safe_path(self, filename: str) -> Path:
        if not filename or Path(filename).name != filename:
            raise InvalidEvidenceError("Nome de evidência inválido")
        return self.root / filename
