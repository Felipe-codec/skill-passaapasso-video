# 4 · Narração

`ferramentas/narrar.py` transforma o `roteiro.json` em `assets/narracao.wav` + `assets/transcript.json` (cada
palavra com início e fim, e a marca `label` nos rótulos «») + `assets/segmentos.json` (início e fim de cada
segmento). As cenas ancoram nesses tempos, então **trocar a voz não muda as cenas**: rode o `narrar.py` de novo,
`node montar.mjs`, e tudo se reposiciona.

## Ordem de trabalho
1. **Rascunho primeiro:** `python3 ferramentas/narrar.py ../roteiro.json --rascunho` gera silêncio com a duração
   estimada (~150 palavras/min). Escreva e revise as cenas sobre ele: é rápido e não gasta voz.
2. **Voz de verdade** antes do render final (o `verificar.py` reprova o rascunho).
3. Mudou uma fala? Rode de novo. O cache (`assets/narracao/segs/<id>-<hash>.wav`) só refaz os segmentos que mudaram.

`assets/narracao/relatorio.txt` traz a duração total, as palavras por minuto e a duração de cada passo; confira
com as regras T5 e T6.

## Modo 1 · voz sintética (padrão)
Kokoro-82M via HyperFrames, local, sem chave de API:
```bash
python3 ferramentas/narrar.py ../roteiro.json                 # voz do roteiro.json ("voz"), padrão pf_dora
python3 ferramentas/narrar.py ../roteiro.json --voz pm_alex
npx hyperframes tts --list                                     # vozes disponíveis
```
Vozes do Kokoro em português do Brasil: `pf_dora` (feminina), `pm_alex` e `pm_santa` (masculinas). Ouça o
primeiro segmento antes de gerar todos. Se uma palavra sair errada (sigla, nome de produto, termo em inglês),
escreva-a no roteiro do jeito que se pronuncia **só no texto falado** e mantenha o rótulo «» com a grafia da tela
quando a palavra for um rótulo. Exemplo: "clique em «Dashboard»" pode sair bem; se não sair, troque a frase
("clique no painel, o «Dashboard»").

Outra voz ou outro serviço: `TUTORIAL_TTS` com o comando que escreve um wav em `{saida}`:
```bash
export TUTORIAL_TTS='meu-tts --texto {texto} --voz {voz} --saida {saida}'
```

## Modo 2 · a voz da pessoa (fusão com a skill reel)
Para um tutorial com a voz do dono do sistema:
1. Mande o roteiro em texto corrido. A pessoa grava lendo, no celular ou no computador, sem se preocupar com
   erros: pode errar e repetir a frase.
2. O **motor de corte da reel** limpa a gravação (silêncios, "éé", retomadas, a última tomada certa de cada frase).
   Siga `$R/corte/CORTE.md` (`R=~/.claude/skills/reel`):
   ```bash
   R=${REEL_SKILL:-~/.claude/skills/reel}; B=$R/corte/scripts
   python3 $B/1-tomadas.py "<gravação>" corte && cat corte/tomadas.txt
   # corte/keeps.json, 2-vicios.py, 3-corte.py, 4-conferir.py (nenhuma palavra comida, R5 da reel)
   ```
3. Alinhe com o roteiro:
   ```bash
   python3 ferramentas/narrar.py ../roteiro.json --gravacao ../corte/clean.mp4 --palavras ../corte/cortepalavras.json
   ```
   O alinhamento procura cada segmento em ordem. Se a pessoa mudou uma frase ao gravar, ajuste o `texto` do
   segmento ao que foi dito (a legenda usa as palavras gravadas) e rode de novo.

## Tempos das palavras
- Com `whisper-cli` + modelo (`WHISPER_MODEL`, o mesmo da reel), os tempos vêm da transcrição de cada segmento
  sempre que ela casa palavra a palavra com o roteiro.
- Sem Whisper, os tempos são distribuídos pelas sílabas dentro de cada segmento. Para voz sintética, o erro fica
  abaixo de ~0,2 s, suficiente para clique e legenda. O início e o fim de cada segmento são exatos (medidos no
  áudio).
- Por isso, prefira ancorar ações importantes no **começo de um segmento** (`K.seg`) ou numa palavra perto dele;
  ações no fim de um segmento longo herdam mais erro da estimativa.
