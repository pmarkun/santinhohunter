# Railway

Este repo usa dois servicos Railway apontando para o mesmo repositorio.

## API

- Config as Code: `/railway/api.toml`
- Builder: Dockerfile em `backend/Dockerfile`
- Healthcheck: `/health`
- Variaveis:
  - `SANTINHO_EMBEDDINGS_PATH=backend/data/candidate_embeddings.pedro-marina.json`
  - `SANTINHO_CORS_ORIGINS=https://seu-pwa.up.railway.app`
  - `SANTINHO_FACE_DEVICE=auto`
  - `SANTINHO_FACE_MODEL=ArcFace`
  - `SANTINHO_FACE_DETECTOR=retinaface`

O fixture versionado tem apenas Pedro da IA e Marina Bragante para validar o match.
A base grande deve entrar depois por volume, bucket ou artefato gerado em pipeline.

## PWA

- Config as Code: `/railway/web.toml`
- Variaveis:
  - `EXPO_PUBLIC_SANTINHO_API_BASE_URL=https://sua-api.up.railway.app`

## Monorepo

No Railway, crie dois servicos a partir do mesmo repositorio e configure cada
servico para usar seu arquivo absoluto de Config as Code. A documentacao do
Railway pede caminho absoluto, por exemplo `/railway/api.toml`.
