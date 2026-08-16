# Railway

Este repo usa dois servicos Railway apontando para o mesmo repositorio.

## API

- CLI: `railway up backend --path-as-root --service santinho-api`
- Config as Code: `backend/railway.toml`
- Builder: Dockerfile em `backend/Dockerfile`
- Healthcheck: `/health`
- Banco: Postgres Railway, criado com `railway add --database postgres`
- Variaveis:
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - `SANTINHO_CANDIDATES_PATH=data/candidates.tse-2026.json`
  - `SANTINHO_EMBEDDINGS_PATH=data/candidate_embeddings.pedro-marina.json`
  - `SANTINHO_CORS_ORIGINS=https://seu-pwa.up.railway.app`
  - `SANTINHO_FACE_DEVICE=auto`
  - `SANTINHO_FACE_MODEL=ArcFace`
  - `SANTINHO_FACE_DETECTOR=retinaface`

O catalogo versionado `backend/data/candidates.tse-2026.json` alimenta busca
manual e ranking com o snapshot TSE 2026 de SP + Presidência. O arquivo de
embeddings ainda pode ser parcial enquanto a geração facial completa não roda.

## PWA

- CLI: `railway up --service santinho-web`
- Config as Code: `railway.toml`
- Variaveis:
  - `EXPO_PUBLIC_SANTINHO_API_BASE_URL=https://sua-api.up.railway.app`

## Monorepo

No Railway, crie dois servicos a partir do mesmo repositorio e configure cada
servico para usar seu arquivo absoluto de Config as Code. A documentacao do
Railway pede caminho absoluto, por exemplo `/railway/api.toml`.
