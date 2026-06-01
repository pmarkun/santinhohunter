# Santinho Hunter Backend

Backend FastAPI para sync e match facial.

## Rodar

```sh
nix develop --command python -m uvicorn santinho_hunter_api.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

## DeepFace

O código carrega DeepFace de forma preguiçosa. O backend básico e os testes rodam no shell padrão sem carregar modelos.

Nao use `nix develop .#face`: DeepFace via nixpkgs puxa uma arvore pesada de TensorFlow/JAX/Triton e pode estourar RAM durante build.

Para habilitar match real, use o Nix para fornecer Python/uv e instale DeepFace por wheels binarias em uma `.venv` local:

```sh
nix develop --command bash scripts/setup-face-env.sh
nix develop --command bash scripts/run-face-backend.sh
```

Isso evita compilar TensorFlow dentro do Nix e ainda mantém o fluxo controlado pelo flake.

A política de dispositivo é:

- `SANTINHO_FACE_DEVICE=auto`: padrão; usa GPU se TensorFlow enxergar uma, senão CPU.
- `SANTINHO_FACE_DEVICE=cpu`: força CPU com `CUDA_VISIBLE_DEVICES=-1`.
- `SANTINHO_FACE_DEVICE=gpu`: exige GPU visível; se não houver, o healthcheck acusa.

Variáveis úteis:

- `SANTINHO_FACE_MODEL=ArcFace`
- `SANTINHO_FACE_DETECTOR=retinaface`
- `SANTINHO_EMBEDDINGS_PATH=backend/data/candidate_embeddings.sample.json`
