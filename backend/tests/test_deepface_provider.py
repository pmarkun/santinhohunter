from io import BytesIO

import numpy as np
from PIL import Image

from santinho_hunter_api.face.deepface_provider import DeepFaceProvider


def image_bytes() -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (32, 32), "white").save(buffer, format="JPEG")
    return buffer.getvalue()


def provider_with(deepface) -> DeepFaceProvider:
    provider = DeepFaceProvider(
        model_name="ArcFace",
        detector_backend="retinaface",
        device_policy="cpu",
    )
    provider._deepface = deepface
    provider._device = "cpu"
    return provider


def test_analysis_rejects_images_without_a_face() -> None:
    class NoFaceDeepFace:
        @staticmethod
        def extract_faces(**_kwargs):
            raise ValueError("Face could not be detected in the image")

    analysis = provider_with(NoFaceDeepFace()).analyze_image_bytes(image_bytes())

    assert analysis.faces == []
    assert analysis.detection_ms >= 0
    assert analysis.embedding_ms >= 0


def test_analysis_embeds_each_detected_face_without_detecting_again() -> None:
    class MultipleFaceDeepFace:
        represent_calls = 0

        @staticmethod
        def extract_faces(**_kwargs):
            face = np.zeros((16, 16, 3), dtype=np.float32)
            return [
                {"face": face, "facial_area": {"x": 1, "y": 2, "w": 3, "h": 4}},
                {"face": face, "facial_area": {"x": 5, "y": 6, "w": 7, "h": 8}},
            ]

        @classmethod
        def represent(cls, **kwargs):
            cls.represent_calls += 1
            assert kwargs["detector_backend"] == "skip"
            return [{"embedding": [1.0, 0.0, 0.0]}]

    deepface = MultipleFaceDeepFace()
    analysis = provider_with(deepface).analyze_image_bytes(image_bytes())

    assert deepface.represent_calls == 2
    assert [face.box for face in analysis.faces] == [(1, 2, 3, 4), (5, 6, 7, 8)]


def test_warm_up_loads_model_and_runs_sample_through_detector() -> None:
    class WarmupDeepFace:
        built_models: list[str] = []
        detection_calls = 0

        @classmethod
        def build_model(cls, model_name: str):
            cls.built_models.append(model_name)

        @classmethod
        def extract_faces(cls, **_kwargs):
            cls.detection_calls += 1
            raise ValueError("Face could not be detected in the image")

    deepface = WarmupDeepFace()
    provider_with(deepface).warm_up(image_bytes())

    assert deepface.built_models == ["ArcFace"]
    assert deepface.detection_calls == 1
