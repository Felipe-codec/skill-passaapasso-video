#!/usr/bin/env bash
# Preparo do motor do tutorial num projeto novo (rode uma vez, na pasta <P>/motor, a cópia de motor/ da skill):
# confere ffmpeg/node, instala HyperFrames + GSAP + Playwright (versões fixas, as mesmas do motor da reel) e cria as pastas.
set -euo pipefail
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "falta Node 20+ (https://nodejs.org)"; exit 1; }
command -v ffmpeg >/dev/null || { echo "falta ffmpeg (Mac: brew install ffmpeg)"; exit 1; }
node -e 'process.exit(+process.versions.node.split(".")[0] >= 20 ? 0 : 1)' || { echo "Node 20+ é necessário"; exit 1; }
[ -d node_modules/hyperframes ] || npm install --no-audit --no-fund
mkdir -p telas/arquivos src assets ../render ../qa ../entrega
[ -f tutorial.json ] || cp tutorial-padrao.json tutorial.json
[ -f src/cenas.js ] || cp cenas-modelo.js src/cenas.js
[ -f telas/telas.json ] || echo "[]" > telas/telas.json
echo "HyperFrames $(npx hyperframes --version 2>/dev/null || echo '?') · $(node --version) · $(ffmpeg -version | head -1 | cut -d' ' -f3)"
npx hyperframes doctor 2>/dev/null | tail -5 || true
echo "motor pronto em $(pwd)"
