#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mode="${1:-cpu}"

case "$mode" in
  cpu)
    venv_dir=".venv"
    requirements="backend/requirements-face.txt"
    ;;
  gpu)
    venv_dir=".venv-gpu"
    requirements="backend/requirements-face-gpu.txt"
    ;;
  *)
    echo "Usage: nix develop --command bash scripts/setup-face-env.sh [cpu|gpu]" >&2
    exit 2
    ;;
esac

if [ ! -x "$venv_dir/bin/python" ]; then
  uv venv "$venv_dir"
fi

uv pip install --python "$venv_dir/bin/python" -r "$requirements"
