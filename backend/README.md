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

Para usar GPU local no NixOS, crie o ambiente separado com os wheels CUDA do
TensorFlow. O deploy continua usando CPU por padrão.

```sh
nix develop --command bash scripts/setup-face-env.sh gpu
SANTINHO_FACE_ENV=gpu SANTINHO_FACE_DEVICE=gpu nix develop --command bash scripts/run-face-backend.sh
```

Para importar o catálogo nacional e gerar embeddings particionados, estado por estado,
com GPU quando disponível e retomada automática:

```sh
nix develop --command bash scripts/build-national-embeddings.sh
```

O runner grava um JSONL incremental, status e logs em
`~/.cache/santinhohunter/tse-2026/national-embeddings/`. Para acompanhar ou repetir
uma UF específica:

```sh
nix develop --command bash scripts/build-national-embeddings.sh --status
nix develop --command bash scripts/build-national-embeddings.sh --only RJ
```

Os arquivos publicados ficam em `backend/data/embeddings/2026/{UF}.json`, com
`BR.json` reservado à Presidência. O backend carrega somente a UF selecionada e
`BR` para cada match; imagens e ZIPs continuam no cache local.

A política de dispositivo é:

- `SANTINHO_FACE_DEVICE=auto`: padrão; usa GPU se TensorFlow enxergar uma, senão CPU.
- `SANTINHO_FACE_DEVICE=cpu`: força CPU com `CUDA_VISIBLE_DEVICES=-1`.
- `SANTINHO_FACE_DEVICE=gpu`: exige GPU visível; se não houver, o healthcheck acusa.

Variáveis úteis:

- `SANTINHO_FACE_MODEL=ArcFace`
- `SANTINHO_FACE_DETECTOR=retinaface`
- `SANTINHO_EMBEDDINGS_PATH=backend/data/embeddings/2026`
- `SANTINHO_CORS_ORIGINS=*`

## Fotos Do TSE

Os zips de fotos do TSE sao grandes e nao devem ser extraidos dentro do repo.
Gere o catalogo versionado de candidatos e manifestos locais de fotos:

```sh
nix develop --command python scripts/import-tse-candidates.py --ufs all --skip-photos
```

O catalogo compacto fica em `backend/data/candidates.tse-2026.json` e entra no
deploy. Os embeddings faciais ficam particionados em
`backend/data/embeddings/2026/`. Zips, manifestos e JSONL
incremental de fotos ficam em `backend/data/tse/` e seguem fora do Git.
