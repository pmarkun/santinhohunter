# Railway

Este repo usa dois servicos Railway apontando para o mesmo repositorio.

## API

- Fonte: GitHub `pmarkun/santinhohunter`, branch `release/playstore-readiness`
- Config as Code: `backend/railway.toml`
- Root directory: `backend`
- Builder: Dockerfile em `backend/Dockerfile`
- Healthcheck: `/health`
- Banco: Postgres Railway, criado com `railway add --database postgres`
- Variaveis:
  - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - `SANTINHO_CANDIDATES_PATH=data/candidates.tse-2026.json`
  - `SANTINHO_EMBEDDINGS_PATH=data/candidate_embeddings.tse-2026.json`
  - `SANTINHO_CORS_ORIGINS=https://seu-pwa.up.railway.app`
  - `SANTINHO_FACE_DEVICE=auto`
  - `SANTINHO_FACE_MODEL=ArcFace`
  - `SANTINHO_FACE_DETECTOR=retinaface`

O catalogo versionado `backend/data/candidates.tse-2026.json` alimenta busca
manual e ranking com o snapshot TSE 2026 de SP + Presidência. O arquivo
versionado `backend/data/candidate_embeddings.tse-2026.json` alimenta o match
facial real para os mesmos candidatos.

Para configurar a API para builds via GitHub em monorepo:

```sh
railway api 'mutation($serviceId:String!,$environmentId:String!,$input:ServiceInstanceUpdateInput!){ serviceInstanceUpdate(serviceId:$serviceId, environmentId:$environmentId, input:$input) }' \
  --variables '{"serviceId":"d3567cbd-e3b4-46c2-9bd4-16080afcb2d3","environmentId":"b6ce5e9d-4a40-48a9-9629-acf9097d7aa7","input":{"rootDirectory":"backend","railwayConfigFile":"backend/railway.toml"}}'
railway service source connect --repo pmarkun/santinhohunter --branch release/playstore-readiness --service santinho-api
```

Nao conecte a API ao GitHub sem `rootDirectory=backend`; nesse caso o Railway
tenta buildar a raiz do app como Railpack e quebra o backend.

## PWA

- Fonte: GitHub `pmarkun/santinhohunter`, branch `release/playstore-readiness`
- Config as Code: `railway.toml`
- Variaveis:
  - `EXPO_PUBLIC_SANTINHO_API_BASE_URL=https://sua-api.up.railway.app`

Para configurar o PWA para builds via GitHub:

```sh
railway service source connect --repo pmarkun/santinhohunter --branch release/playstore-readiness --service santinho-web
```

## Monorepo

No Railway, crie dois servicos a partir do mesmo repositorio e configure cada
servico para usar seu arquivo absoluto de Config as Code. A documentacao do
Railway pede caminho absoluto, por exemplo `/railway/api.toml`.
