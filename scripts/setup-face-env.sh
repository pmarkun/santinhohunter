#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

uv venv .venv
uv pip install -r backend/requirements-face.txt
