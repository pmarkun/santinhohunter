# Performance Do Scan

## Decisao Do Detector

Benchmark local em 17 de agosto de 2026, usando TensorFlow com GPU e 32 montagens
sinteticas de santinhos com 1, 2 e 4 fotos oficiais do TSE, alem de casos sem rosto:

| Detector | Recall de rostos | Falsos positivos | p95 deteccao |
| --- | ---: | ---: | ---: |
| RetinaFace | 100% | 0 | 208,1 ms |
| YuNet | 17,86% | 0 | 9,9 ms |

RetinaFace permanece como padrao. YuNet e muito mais rapido, mas perde rostos pequenos,
especialmente nas montagens que representam santinhos com dobrada.

Para repetir o benchmark:

```bash
nix develop --command bash scripts/setup-face-env.sh gpu
nix develop --command bash -lc \
  'source scripts/face-runtime-env.sh; .venv-gpu/bin/python scripts/benchmark-face-detectors.py --device gpu'
```

O script aplica automaticamente o criterio de adocao: pelo menos 95% do recall do
RetinaFace, reducao minima de 40% no p95 e nenhum falso positivo nos casos negativos.

## Metas No Aparelho

- Preparacao local p95 abaixo de 500 ms.
- Scan completo p50 abaixo de 4 segundos.
- Scan completo p95 abaixo de 7 segundos.
- Nenhuma perda de rosto adicional em santinhos com dois a quatro candidatos.
