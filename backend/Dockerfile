FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV SANTINHO_EMBEDDINGS_PATH=data/candidate_embeddings.tse-2026.json
ENV SANTINHO_CANDIDATES_PATH=data/candidates.tse-2026.json
ENV SANTINHO_CANDIDATE_PHOTO_ARCHIVES=data/foto_cand2026_SP_div.zip,data/foto_cand2026_BR_div.zip
ENV SANTINHO_EVIDENCE_DIR=/data/evidence

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl libgl1 libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements-face.txt requirements-face.txt
RUN pip install --no-cache-dir -r requirements-face.txt

COPY . .

CMD python -m uvicorn santinho_hunter_api.main:app --host 0.0.0.0 --port ${PORT:-8000}
