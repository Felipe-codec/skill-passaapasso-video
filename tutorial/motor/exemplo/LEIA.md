# Exemplo · "Como cadastrar um produto no Lumen Estoque"

Um tutorial completo de 2min10s sobre um sistema **fictício** (o Lumen Estoque, em `sistema/`: quatro páginas
estáticas com dados inventados). É a régua de qualidade da skill. Antes de escrever as cenas de um vídeo novo,
leia `cenas.js` inteiro e veja `previa-sem-voz-540p.mp4`.

## O que tem aqui
| Arquivo | Papel |
|---|---|
| `sistema/` | o "sistema do cliente": HTML + CSS, servido localmente para a captura |
| `telas/capturar.json` | o plano de captura: 4 estados (painel, lista, formulário, lista depois de salvar) |
| `telas/*.html` · `telas/sistema.css` · `telas/telas.json` | o que `ferramentas/capturar.mjs` gerou: o HTML real sem scripts e o CSS escopado |
| `roteiro.json` | 4 passos, 20 segmentos, rótulos da interface entre «» |
| `tema.json` | as cores do sistema (do `app.css`: menu `#10242c`, marca `#0f8b7a`) |
| `tutorial.json` | configuração (título, zoom 1,65, tela desenhada a 1440 px) |
| `cenas.js` | as cenas: ~45 chamadas `K.*`, todas ancoradas na fala |
| `capitulos.txt` | os capítulos que `ferramentas/capitulos.py` gerou |
| `previa-sem-voz-540p.mp4` | prévia visual com a narração em **rascunho** (silêncio com os tempos estimados), efeitos e trilha |

A prévia foi renderizada no ambiente em que a skill foi construída, que não tinha acesso ao npm. Por isso ela não
passou pelo HyperFrames nem tem voz: serve para ver enquadramento, ritmo, cursor, zoom, cartelas e legenda. Na
sua máquina, o mesmo exemplo sai com voz e com o render do HyperFrames seguindo os passos abaixo.

## Rodar o exemplo (prova de que o motor funciona na máquina)
```bash
S=~/.claude/skills/tutorial; P=/tmp/tutorial-exemplo; mkdir -p $P && cd $P
cp -R $S/motor motor && cp $S/motor/exemplo/roteiro.json . && cd motor && bash preparar.sh
cp exemplo/{tema.json,tutorial.json} . && cp exemplo/cenas.js src/cenas.js
# telas: use as já capturadas…
cp exemplo/telas/* telas/
# …ou capture de novo do sistema fictício:
#   python3 -m http.server 8765 --bind 127.0.0.1 --directory exemplo/sistema &   node ferramentas/capturar.mjs exemplo/telas/capturar.json
python3 ferramentas/narrar.py ../roteiro.json            # voz pf_dora (ou --rascunho para ver sem voz)
node montar.mjs && npx hyperframes lint
npx hyperframes render -q high -o ../render/_bruto.mp4
bash ferramentas/audio-final.sh ../render/_bruto.mp4 ../render/tutorial-v1.mp4 "$S/assets/musica/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3"
```

## O que o exemplo ensina (o nível esperado)
- **Toda ação na palavra:** o clique em «Produtos» estala em `K.em("p1-c", "produtos")`, a digitação do preço
  começa em "oitenta", e a escolha de «Cozinha» cai na palavra "cozinha".
- **Geral → foco → geral:** cada passo começa no plano geral com a cartela, aproxima só o que é pequeno (a
  etiqueta "Estoque baixo", o formulário) e volta ao geral antes de trocar de região ou de tela.
- **Orientar antes de mandar clicar:** "vá ao menu lateral, à esquerda" escurece o resto (`forma: "foco"`)
  antes do clique.
- **Antecipar o erro:** o balão do código (SKU) diz que o campo pode ficar em branco. A câmera abre espaço à
  direita antes do balão, para ele não cobrir outro campo.
- **Resultado visível:** depois de salvar, o vídeo destaca o aviso real do sistema ("Produto cadastrado") e a
  linha nova, sem um toast inventado.
- **Dados fictícios coerentes:** Garrafa térmica Aurora, Cozinha, R$ 89,90, 30 unidades.

Cada vídeo tem o seu roteiro e as suas cenas. Não copie as telas do exemplo, copie o nível.
