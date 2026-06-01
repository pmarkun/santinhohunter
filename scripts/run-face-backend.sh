#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -x .venv/bin/python ]; then
  echo "DeepFace venv not found. Run: nix develop --command bash scripts/setup-face-env.sh" >&2
  exit 1
fi

export PYTHONPATH="$PWD/backend:${PYTHONPATH:-}"
exec .venv/bin/python -m uvicorn santinho_hunter_api.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
