#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

face_env="${SANTINHO_FACE_ENV:-cpu}"
case "$face_env" in
  cpu)
    venv_dir=".venv"
    ;;
  gpu)
    venv_dir=".venv-gpu"
    ;;
  *)
    echo "SANTINHO_FACE_ENV must be cpu or gpu." >&2
    exit 2
    ;;
esac

if [ ! -x "$venv_dir/bin/python" ]; then
  echo "DeepFace venv not found. Run: nix develop --command bash scripts/setup-face-env.sh $face_env" >&2
  exit 1
fi

source scripts/face-runtime-env.sh
exec "$venv_dir/bin/python" -m uvicorn santinho_hunter_api.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
