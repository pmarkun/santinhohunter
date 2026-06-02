FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/backend
ENV SANTINHO_EMBEDDINGS_PATH=backend/data/candidate_embeddings.pedro-marina.json

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-face.txt backend/requirements-face.txt
RUN pip install --no-cache-dir -r backend/requirements-face.txt

COPY backend backend

CMD python -m uvicorn santinho_hunter_api.main:app --app-dir backend --host 0.0.0.0 --port ${PORT:-8000}
