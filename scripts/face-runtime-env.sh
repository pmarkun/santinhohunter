#!/usr/bin/env bash

export PYTHONPATH="$PWD/backend:${PYTHONPATH:-}"
export TF_FORCE_GPU_ALLOW_GROWTH="${TF_FORCE_GPU_ALLOW_GROWTH:-true}"

if [ -d /run/opengl-driver/lib ]; then
  export LD_LIBRARY_PATH="/run/opengl-driver/lib:${LD_LIBRARY_PATH:-}"
fi

for nvidia_lib in "$PWD"/.venv*/lib/python*/site-packages/nvidia/*/lib; do
  if [ -d "$nvidia_lib" ]; then
    export LD_LIBRARY_PATH="$nvidia_lib:${LD_LIBRARY_PATH:-}"
  fi
done
