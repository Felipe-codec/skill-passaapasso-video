#!/usr/bin/env bash
# Áudio final do tutorial: trilha em loop por baixo da narração (abaixa sozinha quando a voz fala) + −14 LUFS integrado
# (±0,3) e pico verdadeiro ≤ −1 dBTP, sem recodificar a imagem. A parte de loudness é a mesma do áudio final aprovado da
# skill reel (ganho + limitador em 192 kHz, calibrado em até 3 passadas).
# Uso (na pasta do motor):
#   bash ferramentas/audio-final.sh ../render/_bruto.mp4 ../render/tutorial-v1.mp4 [trilha.mp3|nenhuma] [volume da trilha em dB, padrão -21]
set -euo pipefail
IN="$1"; OUT="$2"; TRILHA="${3:-nenhuma}"; VOLT="${4:--21}"; ALVO=-14
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
if [ "$TRILHA" != "nenhuma" ] && [ -f "$TRILHA" ]; then
  FO=$(python3 -c "print(max(0, ${D} - 3.5))")
  ffmpeg -v error -y -i "$IN" -stream_loop -1 -i "$TRILHA" -filter_complex \
    "[0:a]aresample=48000,asplit=2[voz][chave];\
     [1:a]aresample=48000,atrim=0:${D},asetpts=PTS-STARTPTS,volume=${VOLT}dB,afade=t=in:d=1.5,afade=t=out:st=${FO}:d=3.5[mus];\
     [mus][chave]sidechaincompress=threshold=0.02:ratio=5:attack=40:release=600:makeup=1[musd];\
     [voz][musd]amix=inputs=2:normalize=0:duration=first[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a pcm_s16le "$TMP/mix.mov"
  SRC="$TMP/mix.mov"; echo "— trilha: $(basename "$TRILHA") a ${VOLT} dB, abaixando sob a voz"
else
  SRC="$IN"; echo "— sem trilha"
fi
med() { ffmpeg -nostats -i "$1" -af "loudnorm=I=${ALVO}:TP=-1:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p'; }
campo() { python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
I0=$(med "$SRC" | campo input_i)
G=$(python3 -c "print(round(${ALVO} - (${I0}), 2))")
echo "— bruto: ${I0} LUFS → ganho inicial ${G} dB"
for n in 1 2 3; do
  ffmpeg -v error -y -i "$SRC" -c:v copy -af "aresample=192000,volume=${G}dB,alimiter=limit=0.84:attack=1:release=50:level=false,aresample=48000" \
    -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT"
  J=$(med "$OUT"); I=$(echo "$J" | campo input_i); TP=$(echo "$J" | campo input_tp)
  echo "— passada ${n}: ganho ${G} dB → ${I} LUFS · pico ${TP} dBTP"
  DD=$(python3 -c "print(round(${ALVO} - (${I}), 2))")
  python3 -c "import sys; sys.exit(0 if abs(${DD}) <= 0.3 else 1)" && break
  G=$(python3 -c "print(round(${G} + ${DD}, 2))")
done
python3 -c "import sys; sys.exit(0 if ${TP} <= -0.5 else 1)" || echo "AVISO: pico ${TP} dBTP acima de −0,5 — baixe o limit do alimiter (0,84 → 0,79)"
echo "final: $OUT"
