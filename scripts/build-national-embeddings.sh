#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"
source "$ROOT_DIR/scripts/face-runtime-env.sh"
FACE_PYTHON=${SANTINHO_FACE_PYTHON:-"$ROOT_DIR/.venv-gpu/bin/python"}
if [[ ! -x "$FACE_PYTHON" ]]; then
  FACE_PYTHON=${SANTINHO_FACE_FALLBACK_PYTHON:-python}
fi
CACHE_DIR=${SANTINHO_TSE_CACHE_DIR:-"$HOME/.cache/santinhohunter/tse-2026"}
CATALOG=${SANTINHO_CATALOG_PATH:-"$ROOT_DIR/backend/data/candidates.tse-2026.json"}
EMBEDDINGS_DIR=${SANTINHO_EMBEDDINGS_DIR:-"$ROOT_DIR/backend/data/embeddings/2026"}
STATE_DIR=${SANTINHO_EMBEDDINGS_STATE_DIR:-"$CACHE_DIR/national-embeddings"}
STATUS_FILE=$STATE_DIR/status.tsv
LOG_DIR=$STATE_DIR/logs
JSONL_DIR=$STATE_DIR/jsonl

UFS=(AC AL AP AM BA CE DF GO ES MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO)
PARTITIONS=(BR "${UFS[@]}")

usage() {
  printf 'Uso: %s [--status] [--only UF] [--force]\n' "${BASH_SOURCE[0]}"
  printf 'Exemplo: nix develop --command bash scripts/build-national-embeddings.sh\n'
}

init_status() {
  mkdir -p "$STATE_DIR" "$LOG_DIR" "$JSONL_DIR" "$EMBEDDINGS_DIR"
  if [[ ! -f "$STATUS_FILE" ]]; then
    for uf in "${PARTITIONS[@]}"; do
      printf '%s\tpending\n' "$uf"
    done >"$STATUS_FILE"
  else
    local temporary
    temporary=$(mktemp "$STATE_DIR/status.XXXXXX")
    awk -F '\t' 'BEGIN { OFS = "\t" } $2 == "running" { $2 = "pending" } { print }' \
      "$STATUS_FILE" >"$temporary"
    mv "$temporary" "$STATUS_FILE"
  fi
}

status_for() {
  awk -F '\t' -v target="$1" '$1 == target { print $2 }' "$STATUS_FILE"
}

set_status() {
  local uf=$1
  local value=$2
  local temporary
  temporary=$(mktemp "$STATE_DIR/status.XXXXXX")
  awk -F '\t' -v target="$uf" -v value="$value" 'BEGIN { OFS = "\t" } $1 == target { $2 = value } { print }' \
    "$STATUS_FILE" >"$temporary"
  mv "$temporary" "$STATUS_FILE"
}

show_status() {
  while IFS=$'\t' read -r uf state; do
    local progress=''
    if [[ -f "$LOG_DIR/$uf.log" ]]; then
      progress=$(rg -o 'processed=[0-9]+ written=[0-9]+ skipped=[0-9]+ failures=[0-9]+' "$LOG_DIR/$uf.log" | tail -n 1 || true)
    fi
    if [[ -n "$progress" ]]; then
      printf '[%s] %s - %s\n' "$state" "$uf" "$progress"
    else
      printf '[%s] %s\n' "$state" "$uf"
    fi
  done <"$STATUS_FILE"
}

build_catalog() {
  if [[ -f "$CATALOG" && ${SANTINHO_REBUILD_CATALOG:-0} != 1 ]]; then
    return
  fi
  printf 'Importando catálogo nacional do TSE...\n'
  "$FACE_PYTHON" "$ROOT_DIR/scripts/import-tse-candidates.py" \
    --year 2026 \
    --ufs all \
    --cache-dir "$CACHE_DIR" \
    --output "$CATALOG" \
    --skip-photos
}

process_partition() {
  local uf=$1
  local log_file="$LOG_DIR/$uf.log"
  local jsonl_file="$JSONL_DIR/$uf.jsonl"
  local output_file="$EMBEDDINGS_DIR/$uf.json"

  set_status "$uf" running
  printf '\n[%s] iniciando (log: %s)\n' "$uf" "$log_file"
  set +e
  "$FACE_PYTHON" "$ROOT_DIR/scripts/generate-tse-face-embeddings.py" \
    --catalog "$CATALOG" \
    --cache-dir "$CACHE_DIR" \
    --output-jsonl "$jsonl_file" \
    --output "$output_file" \
    --year 2026 \
    --ufs "$uf" \
    --device "${SANTINHO_FACE_DEVICE:-auto}" 2>&1 | tee "$log_file"
  local exit_code=${PIPESTATUS[0]}
  set -e

  local failure_count=0
  if [[ -f "$log_file" ]]; then
    failure_count=$(rg -o 'failures=[0-9]+' "$log_file" | tail -n 1 | cut -d= -f2 || true)
  fi

  if [[ $exit_code -eq 0 && ${failure_count:-0} -eq 0 ]]; then
    set_status "$uf" done
    printf '[done] %s\n' "$uf"
  else
    set_status "$uf" failed
    printf '[failed] %s (exit %s, embedding failures %s)\n' "$uf" "$exit_code" "${failure_count:-0}" >&2
    return 1
  fi
}

main() {
  local only=''
  local force=0
  local show_only=0
  while (($#)); do
    case "$1" in
      --status) show_only=1 ;;
      --only) shift; only=${1:?UF ausente em --only} ;;
      --force) force=1 ;;
      --help|-h) usage; return 0 ;;
      *) printf 'Argumento desconhecido: %s\n' "$1" >&2; usage >&2; return 2 ;;
    esac
    shift
  done

  init_status
  if ((show_only)); then
    show_status
    return 0
  fi

  build_catalog
  local failures=0
  for uf in "${PARTITIONS[@]}"; do
    if [[ -n "$only" && ${only^^} != "$uf" ]]; then
      continue
    fi
    if [[ $force -eq 0 && $(status_for "$uf") == done ]]; then
      printf '[done] %s (retomado do checkpoint)\n' "$uf"
      continue
    fi
    process_partition "$uf" || failures=$((failures + 1))
    if [[ -n "$only" ]]; then
      break
    fi
  done

  show_status
  if ((failures)); then
    printf '\n%s partição(ões) falharam; use --only UF para reprocessar.\n' "$failures" >&2
    return 1
  fi

  if [[ -z "$only" ]]; then
    printf '\nValidando conjunto nacional...\n'
    "$FACE_PYTHON" "$ROOT_DIR/scripts/validate-national-embeddings.py" \
      --catalog "$CATALOG" \
      --embeddings-dir "$EMBEDDINGS_DIR"
  fi
}

main "$@"
