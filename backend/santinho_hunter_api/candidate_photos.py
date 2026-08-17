from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from PIL import Image, ImageStat

from santinho_hunter_api.tse.photos import parse_photo_name


@dataclass(frozen=True)
class CandidatePhoto:
    content: bytes
    media_type: str


@dataclass(frozen=True)
class _PhotoLocation:
    archive_path: Path
    archive_name: str
    extension: str


class CandidatePhotoStore:
    def __init__(self, archive_paths: tuple[Path, ...]) -> None:
        self._locations: dict[str, _PhotoLocation] = {}
        for archive_path in archive_paths:
            if not archive_path.exists():
                continue
            with ZipFile(archive_path) as archive:
                for archive_name in archive.namelist():
                    parsed = parse_photo_name(archive_name)
                    if parsed is None:
                        continue
                    image_bytes = archive.read(archive_name)
                    if is_placeholder_photo(image_bytes):
                        continue
                    _uf, candidate_id, extension = parsed
                    self._locations[candidate_id] = _PhotoLocation(
                        archive_path=archive_path,
                        archive_name=archive_name,
                        extension=extension,
                    )

    def count(self) -> int:
        return len(self._locations)

    def has(self, candidate_id: str) -> bool:
        return candidate_id in self._locations

    def read(self, candidate_id: str) -> CandidatePhoto | None:
        location = self._locations.get(candidate_id)
        if location is None:
            return None

        with ZipFile(location.archive_path) as archive:
            content = archive.read(location.archive_name)

        media_type = "image/jpeg" if location.extension in {"jpg", "jpeg"} else "application/octet-stream"
        return CandidatePhoto(content=content, media_type=media_type)


def is_placeholder_photo(image_bytes: bytes) -> bool:
    try:
        with Image.open(BytesIO(image_bytes)) as image:
            statistics = ImageStat.Stat(image.convert("RGB").resize((32, 32)))
    except Exception:
        return True

    return max(statistics.stddev) < 5
