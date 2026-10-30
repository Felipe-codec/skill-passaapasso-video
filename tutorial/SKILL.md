---
name: tutorial
description: Faz um VÍDEO TUTORIAL passo a passo (16:9, 2 a 5 min) de como usar um sistema, app ou site que a pessoa construiu, a partir do CÓDIGO do sistema, sem gravar a tela. A skill lê o código, acha a tarefa e o caminho de cliques, escreve o roteiro com os rótulos reais, captura as telas reais do sistema rodando em localhost (ou as recria do código), gera a narração e monta o vídeo no motor HyperFrames da skill reel. O vídeo tem a janela do sistema, cursor que clica e digita, zoom no que importa, destaques, passos numerados, legenda e trilha baixa. Entrega render/tutorial-v1.mp4 verificado, capítulos para o YouTube e capa. Use SEMPRE que pedirem "faz um tutorial do meu sistema", "vídeo passo a passo de como usar", "vídeo de treinamento", "mostra no vídeo como cadastrar/emitir/configurar X", "manual em vídeo", "onboarding em vídeo" ou "/tutorial", mesmo sem citar a skill. NÃO é o reel vertical com a pessoa falando (skill reel) nem o vídeo de lançamento de 20 s (/brag).
---

# tutorial · do código do sistema ao passo a passo em vídeo

Fusão de duas skills:
- **Do /brag:** ler o projeto em vez de pedir gravação, achar o fluxo de uso (entrada → ação → resultado),
  mostrar a coisa de verdade, nenhuma afirmação inventada, nenhum segredo na tela, trilha e efeitos com
  parcimônia, capa no quadro 0.
- **Da reel:** o motor HyperFrames + GSAP com cada peça ancorada na palavra falada (`K.at`), as regras da casa,
  o áudio final a −14 LUFS, a verificação antes de entregar e o motor de corte para quando a narração for a voz da
  própria pessoa.

O resultado é um vídeo horizontal de 2 a 5 minutos que ensina **uma tarefa** do sistema, clique a clique.
**Nunca publique nem envie o vídeo.**

Leia antes de começar (nesta ordem, inteiros): `regras.md` → `referencias/1-inspecionar.md` …
`referencias/6-entregar.md` → `motor/exemplo/LEIA.md`. O padrão de qualidade é o exemplo
(`motor/exemplo/cenas.js` é a régua), não um mínimo.

## Mapa da skill
```
SKILL.md                 este arquivo (o fluxo)
regras.md                T1–T11: mostrar a coisa de verdade, nada secreto, uma ação por frase, ação na palavra…
referencias/             1-inspecionar · 2-roteiro · 3-telas · 4-narracao · 5-cenas (a API do kit) · 6-entregar
motor/                   o motor 16:9 (copiado para cada projeto): kit/ · montar.mjs · preparar.sh · ferramentas/ · exemplo/
assets/musica/           duas trilhas CC BY 4.0 (crédito obrigatório na descrição) — LICENCA.md
```
`S=~/.claude/skills/tutorial` (link para `reel/tutorial`; ou `TUTORIAL_SKILL`) e `R=~/.claude/skills/reel` (a skill reel,
onde fica o motor de corte; ou `REEL_SKILL`). Use `$R/corte`, nunca `$S/../corte`: no Windows, com a junção, o `..`
não volta para a pasta da reel. Variáveis (R10 da reel):
`TUTORIAL_TTS` (comando da voz), `WHISPER_MODEL`, `CHROME`.

## Fluxo (ordem fixa)

### 0 · Projeto
1. Uma pasta por tutorial, na raiz do projeto do sistema: `tutorial-<slug>/` com `motor/` (`cp -R $S/motor`),
   `render/`, `qa/`, `entrega/`. Se já existir, use `tutorial-<slug>-<AAAAMMDD-HHMM>/`; nunca sobrescreva outro.
2. `bash motor/preparar.sh` (Node 20+, ffmpeg, HyperFrames 0.7.109, GSAP 3.14.2, Playwright: as mesmas versões
   do motor da reel). Etapa lenta em segundo plano.
3. Diga em uma linha o que vai acontecer ("Lendo o código para achar o passo a passo; te mostro o roteiro antes de
   gerar a voz").

### 1 · Inspecionar o sistema (`referencias/1-inspecionar.md`)
Leia rotas, telas, componentes, formulários, validações, rótulos e o CSS. Responda às 10 perguntas em
`inspecao.md`. A mais importante: **qual tarefa** o vídeo ensina. Se a pessoa não disse e o sistema tem
várias, pergunte uma vez, com 3 a 5 tarefas candidatas tiradas do código.

### 2 · Roteiro (`referencias/2-roteiro.md`)
Escreva `plano.md` (tarefa, público, pré-requisitos, passos com tela → ação → resultado, onde as pessoas erram)
e `roteiro.json` (passos + segmentos da narração, rótulos da interface entre «»).
**Portão:** mostre os passos e as falas e espere o OK, porque só a pessoa sabe se o processo do negócio está
certo. A exceção é quando ela disser "vai direto". Ajustar o roteiro custa um minuto; refazer voz e render custa
muito mais.

### 3 · Telas e tema (`referencias/3-telas.md`)
- **Sistema roda localmente (preferido):** suba o servidor de desenvolvimento com dados de teste,
  escreva `motor/telas/capturar.json` (uma entrada por estado da tela, com ações para abrir modal ou preencher) e
  rode `node ferramentas/capturar.mjs`. As telas saem com o HTML e o CSS reais, sem scripts.
- **Não roda:** recrie cada tela em `motor/telas/<id>.html` a partir dos componentes e do CSS do código (mesma
  estrutura, mesmos rótulos, mesmas cores). Declare isso no `plano.md`.
- `motor/tema.json` com as cores e fontes do sistema (da inspeção). Sem ele, vale a pele nativa da reel.

### 4 · Narração (`referencias/4-narracao.md`)
```bash
cd motor && python3 ferramentas/narrar.py ../roteiro.json --rascunho   # tempos estimados, sem voz: monte as cenas já
```
Com as cenas aprovadas, a voz de verdade: `python3 ferramentas/narrar.py ../roteiro.json` (Kokoro do HyperFrames,
`pf_dora` por padrão) ou a **voz da pessoa**: ela grava lendo o roteiro, o motor de corte da reel limpa
(`$R/corte/`, com `R=~/.claude/skills/reel`) e `narrar.py --gravacao … --palavras …` alinha. As cenas não mudam entre os modos.

### 5 · Cenas (`referencias/5-cenas.md`)
`src/cenas.js`: uma chamada `K.*` por ação, sempre ancorada na fala (`K.seg`, `K.em`, `K.at`). Leia
`motor/exemplo/cenas.js` inteiro antes. Depois:
```bash
node montar.mjs && npx hyperframes lint          # 0 erros; tela em branco = âncora ou seletor quebrado (leia o console)
npx hyperframes snapshot --at <cada passo, cada clique, cada zoom> -o ../qa/snapshots
```
Confira cada snapshot: o cursor está no alvo, o zoom não corta o que a voz descreve, nada cobre a ação e o texto
está legível.

### 6 · Render, áudio e entrega (`referencias/6-entregar.md`)
```bash
npx hyperframes render -q high -o ../render/_bruto.mp4
bash ferramentas/audio-final.sh ../render/_bruto.mp4 ../render/tutorial-v1.mp4 "$S/assets/musica/<trilha>.mp3"
python3 ferramentas/capitulos.py ../roteiro.json assets/segmentos.json > ../entrega/capitulos.txt
bash ferramentas/capa.sh ../render/tutorial-v1.mp4 <segundo da abertura assentada>
bash ferramentas/folha.sh ../render/tutorial-v1.mp4 ../qa/folha-final.png
python3 ferramentas/verificar.py .. --video render/tutorial-v1.mp4    # VERIFY.md todo aprovado
```
Escreva `entrega/descricao.txt` (o que o vídeo ensina, capítulos, crédito da trilha) e `MINUTAGEM.md`. Critique
antes de mostrar: até 2 rodadas de ajuste. Responda com o caminho do vídeo, a duração, LUFS e pico, os passos, o
modo da voz, o que foi capturado e o que foi recriado, os dados fictícios usados e os pontos abertos.
Ajuste pedido → `tutorial-v<N+1>.mp4`. Mudou o roteiro → `narrar.py` de novo (o cache refaz só o que mudou) e
as âncoras se ajustam sozinhas; nunca recronometre à mão.

## Regras de condução
- **O kit não se reescreve por vídeo.** Cada tutorial escreve só `roteiro.json`, `telas/`, `tema.json`,
  `tutorial.json` e `src/cenas.js`. Faltou uma peça? Melhore o kit de propósito, para todos os vídeos, e registre.
- **Uma versão por rodada**, completa e verificada.
- **Material real:** rótulo, menu, campo e mensagem que aparecem no vídeo existem no código. O dado de exemplo é
  fictício e plausível, e isso fica dito no plano.
- **Você produz** nesta sessão. Se a pessoa pedir um agente, lance um general-purpose com este SKILL.md +
  `regras.md` + `referencias/5-cenas.md` como brief e critique a entrega.
- Falhou algo (npm, Chrome, voz, captura)? Diga em uma linha o que fazer. `npx hyperframes doctor` diagnostica o
  render.
