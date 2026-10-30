# skill reel

Skill de Claude Code que **corta e edita um reel** (9:16) a partir da gravação bruta de alguém falando, sem
painel e sem escolhas: manda o vídeo, ela corta e edita.

- **Corte**: tira silêncios, respirações, "éé", gaguejos, erros, retomadas e repetições. Corte pelo som (volume +
  timbre, calibrado pelo nível da gravação), bordas no vale de energia, cortes J/L e conferência de cada emenda
  por transcrição. É o motor de corte aprovado em produção (out/2026), copiado intacto.
- **Edição**: o motor **VSL com interface animada** — a câmera alterna tela cheia com punch-in e tela dividida com
  o apresentador num card; cada palavra-chave falada vira uma peça de interface que entra exatamente na palavra;
  legenda que segue a boca; efeitos sonoros enxutos; áudio a −14 LUFS. É o mesmo kit (intocado) e as mesmas
  regras que produziram o reel de referência aprovado; remontado, o exemplo sai idêntico pixel a pixel.

Entrega `render/reel-v1.mp4` verificado (`VERIFY.md`, folha de quadros, zona segura, LUFS) e itera a pedido.

O repositório traz também a skill **tutorial** (`tutorial/`): vídeo **passo a passo** (16:9, 2 a 5 min) de como usar
um sistema que você construiu, feito a partir do **código** do sistema, sem gravar a tela. É a fusão desta skill com o
[/brag](https://github.com/latent-spaces/brag) (MIT). Do /brag vêm ler o projeto, achar o fluxo de uso e mostrar a
interface real. Da reel vêm o motor HyperFrames ancorado na fala, o áudio a −14 LUFS, a verificação e o motor de
corte para narrar com a própria voz. Detalhes em [`tutorial/SKILL.md`](tutorial/SKILL.md).

## Instalar
```bash
git clone https://github.com/Felipe-codec/skill-passaapasso-video.git ~/.claude/skills/reel
ln -s ~/.claude/skills/reel/tutorial ~/.claude/skills/tutorial     # a skill tutorial
```
No Windows (PowerShell, sem administrador), o link da tutorial é uma junção:
```powershell
New-Item -ItemType Junction -Path "$HOME\.claude\skills\tutorial" -Target "$HOME\.claude\skills\reel\tutorial"
```
A pasta precisa se chamar `reel`: a tutorial usa o motor de corte dela (`~/.claude/skills/reel/corte`).
Já tem uma instalação antiga? Na pasta da skill: `git remote set-url origin https://github.com/Felipe-codec/skill-passaapasso-video.git && git pull origin main`.
Depois, no Claude Code, é só mandar o vídeo e pedir "edita esse reel" (ou `/reel`). Para um tutorial, abra o
projeto do sistema e peça "faz um tutorial de como cadastrar X" (ou `/tutorial`).

## O que a máquina precisa
| Para | Ferramenta |
|---|---|
| corte e transcrição | `ffmpeg`, `whisper-cli` (whisper.cpp) + modelo `ggml-large-v3-turbo.bin` em `~/.cache/whisper-cpp/` (ou `WHISPER_MODEL`), Python 3 com `numpy` |
| enquadramento, zona segura, legenda que segue a boca | `opencv-python-headless` (e, se quiser o rastreio fino, `mediapipe` num Python apontado por `VSL_PYTHON`) |
| composição e render | Node 20+ (o `preparar.sh` instala `hyperframes` 0.7.109, `gsap` 3.14.2 e `playwright`), Google Chrome (ou `CHROME=<executável>`) |

`python3 corte/scripts/0-checar.py` diz o que falta e como instalar. Mac: `brew install ffmpeg whisper-cpp`.

## Como funciona (o fluxo que o `SKILL.md` segue)
1. **Corte** (`corte/`): mapa de tomadas pela energia → escolha editorial dos *keeps* → transcrição que não esconde
   vícios → motor de corte → conferência (texto, repetições, emendas, pausas). Sai `clean.mp4` + `cortepalavras.json`.
2. **Motor VSL** (`modelo/`): `preparar.sh` (câmera 9:16 com a voz, transcript, rastreio da boca) → transcript
   corrigido → enquadramento medido (`vsl.json`) → material real com fontes (`SOURCES.md`) → mapa de beats →
   `src/beats.js` (só chamadas `K.*` ancoradas na fala) → lint → snapshots → zona segura → render → áudio final →
   `verificar.py` → `reel-v1.mp4`.

## Estrutura
```
SKILL.md              o fluxo que o Claude segue
regras-da-casa.md     R1–R11 (rosto nunca coberto, SFX com parcimônia, material real, nenhuma palavra comida, −14 LUFS…)
ESTILO.md             a especificação do motor VSL (layouts, movimento, legenda, peças, som, aceite, lições de produção)
pele.json             valores nativos (fontes, cores, invariantes)
corte/                motor de corte: CORTE.md · references/EDICAO-BRUTA.md · scripts/ · exemplo/ (gabarito aprovado)
modelo/               motor VSL: kit/ · montar.mjs · preparar.sh · ferramentas/ · exemplo/ (o reel aprovado inteiro)
ferramentas/          preparar.py · rosto.py · ancoras.py · verificar.py · zona-segura.py · recortar.py · audio-final.sh
anexos/               quadros da referência e o antes × depois da cor
tutorial/             skill tutorial: SKILL.md · regras.md · referencias/ · motor/ (kit 16:9, ferramentas, exemplo) · assets/musica/
```

## Licenças do material embutido
- **Skill tutorial:** a estrutura de inspeção, o plano e as regras de "mostrar a coisa de verdade" vêm do /brag
  (MIT, © 2026 Shunit Haviv Hakimi, `tutorial/LICENCA-BRAG.txt`). As trilhas de `tutorial/assets/musica/` são de
  Sascha Ende (ende.app, **CC BY 4.0**, crédito obrigatório na descrição do vídeo). Os efeitos `clique`, `passar`,
  `selecao`, `transicao`, `destaque`, `sucesso`, `soltar` e `carta` são da [Kenney](https://kenney.nl/) (CC0), via /brag.

Fontes Anybody, Plus Jakarta Sans e JetBrains Mono sob OFL (arquivos `OFL-*.txt` em `modelo/kit/fonts/`); os efeitos
sonoros de `modelo/kit/sfx/` são procedurais (gerados por `modelo/ferramentas/gerar-sfx.mjs`); GSAP e HyperFrames vêm
pelo `npm`. Os logos do exemplo vêm do Wikimedia Commons e estão listados em `modelo/exemplo/SOURCES.md`.
