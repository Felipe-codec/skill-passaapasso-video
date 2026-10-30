#!/usr/bin/env bash
# Capa do tutorial (do /brag): tira o quadro mais forte e ASSENTADO (texto já entrou, fora de transição) para
# ../entrega/capa.jpg e grava esse quadro como o quadro 0 do vídeo, para todo player e plataforma mostrar a capa
# parado. Troca só o quadro 0: duração, quadros e áudio continuam iguais.
# Uso (na pasta do motor):  bash ferramentas/capa.sh ../render/tutorial-v1.mp4 <segundo do quadro>
set -euo pipefail
V="$1"; T="$2"; CAPA="../entrega/capa.jpg"; mkdir -p ../entrega
ffmpeg -v error -y -ss "$T" -i "$V" -frames:v 1 -q:v 2 "$CAPA"
ffmpeg -v error -y -i "$V" -i "$CAPA" -filter_complex "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]" \
  -map "[v]" -map "0:a?" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a copy -movflags +faststart "${V%.mp4}.capa.mp4"
mv "${V%.mp4}.capa.mp4" "$V"
echo "capa: $CAPA (quadro de ${T}s, gravado como quadro 0 de $(basename "$V"))"
