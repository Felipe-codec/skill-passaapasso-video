#!/usr/bin/env bash
# Folha de quadros do vídeo final: 16 quadros espaçados por igual, 4×4, 480 px cada (para a revisão e o VERIFY).
# Uso (na pasta do motor):  bash ferramentas/folha.sh ../render/tutorial-v1.mp4 ../qa/folha-final.png
set -euo pipefail
V="$1"; OUT="${2:-../qa/folha-final.png}"; mkdir -p "$(dirname "$OUT")"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
STEP=$(python3 -c "print(round(${D}/16, 4))")
ffmpeg -v error -y -ss $(python3 -c "print(round(${STEP}/2,3))") -i "$V" -vf "fps=1/${STEP},scale=480:-1,tile=4x4:padding=6:color=black" -frames:v 1 "$OUT"
echo "folha: $OUT (um quadro a cada ${STEP} s)"
