# 5 · Cenas (a API do kit)

`motor/src/cenas.js` é o único código que muda de tutorial para tutorial: uma chamada `K.*` por ação, em ordem
cronológica, sempre com o tempo vindo da fala. O kit (`motor/kit/tut.js`) segue a arquitetura do kit VSL da reel:
as funções só agendam tweens num timeline GSAP pausado, que o HyperFrames percorre quadro a quadro (determinístico).
Leia `motor/exemplo/cenas.js` inteiro antes de escrever.

## Gramática
```
fala (segmento do roteiro) → câmera (geral | foco) → ação (mover | clicar | digitar | lista) → reforço (destacar | nota | aviso)
```
Para cada passo:
1. `K.passo(n, K.seg("pN-a"))`: barra da janela + progresso + cartela do passo (com a câmera no geral).
2. Oriente: o que a pessoa está vendo (`K.destacar` na região que a voz descreve).
3. Aproxime se o alvo for pequeno (`K.foco`), faça a ação na palavra (`K.clicar`/`K.digitar`/`K.lista`).
4. Mostre o resultado (`K.tela` nova, `K.mostrar`, `K.destacar` no aviso) e volte ao geral (`K.geral`).

## Tempo (âncoras)
| Função | Devolve |
|---|---|
| `K.seg(id)` · `K.segFim(id)` | início/fim do segmento do roteiro (exatos) |
| `K.em(id, "frase")` | início da frase **dentro** do segmento (a âncora mais usada) |
| `K.at("frase", n?, depois?)` | início da n-ésima ocorrência da frase na narração inteira |
| `K.end("frase")` · `K.wt("frase")` · `K.has("frase")` | fim · tempo de cada palavra · existe? |

A comparação ignora maiúsculas, acentos e pontuação. Se a frase não existe, dá erro (e o snapshot sai em branco):
**nunca chute um número**. Margens pequenas são normais: `K.em(...) + 0.25`, `K.segFim(...) + 0.3`.

## Telas e câmera
| Função | O que faz |
|---|---|
| `K.tela(id, t, {transicao})` | mostra a tela em t: `"funde"` (padrão), `"desliza"`, `"corte"` (a primeira é sempre corte). Troca a rota da barra |
| `K.rolar(y, t, {alvo, d})` | rola a tela (ou o contêiner `alvo`) até y px, chegando em t. Os alvos seguintes já descontam a rolagem |
| `K.foco(alvo, t, {zoom, d, foco})` | aproxima o alvo chegando em t (zoom 1,4–2,0; padrão `tutorial.json → zoom`). Nunca deixa ver fora da janela nem uma tira da barra |
| `K.geral(t, {d})` | volta ao plano geral chegando em t (`d: 0` = corte seco) |
| `K.respirar(t, d, quanto)` | aproximação lenta contínua para trechos de explicação longos |

`alvo` é um seletor CSS procurado na tela atual (`"#salvar"`, `'aside a[href="/produtos"]'`, `"tr.novo"`),
um elemento ou `{x, y}` em coordenadas do palco. Seletor inexistente dá erro.

## Ações (o cursor aparece sozinho na primeira)
| Função | O que faz |
|---|---|
| `K.mover(alvo, t, {d, dx, dy})` | cursor chega no centro do alvo em t (duração pela distância) |
| `K.clicar(alvo, t, {semMover, pressionar, efeito})` | cursor chega um instante antes, o clique estala **em t** (anel + som + o botão afunda) |
| `K.digitar(campo, "texto", t, {cps, clicar})` | clica no campo e digita a partir de t (14 letras/s; use `cps` baixo para números ditos devagar). Som de digitação contínuo |
| `K.lista(campo, opcoes, escolha, t, {destaqueDe, valor})` | abre a lista suspensa desenhada pelo kit abaixo do campo, clica a escolha em t, fecha, o campo passa a mostrá-la |
| `K.escolher(menu, opcao, t, {gatilho, valor})` | o mesmo para um menu que a própria tela traz oculto (`.k-oculto`) |
| `K.cursor(visivel, t, {em})` | mostra/esconde o cursor (esconda antes do encerramento) |

## Estados da tela
| Função | O que faz |
|---|---|
| `K.mostrar(alvo, t, {de, d, sfx})` | revela um elemento oculto (`.k-oculto`): `de: "baixo" \| "cima" \| "escala"` |
| `K.esconder(alvo, t)` | some com ele |
| `K.texto(alvo, "novo", t)` | troca o texto (ou o valor do campo/select) em t |
| `K.estado(alvo, "valor", t)` | `data-k-estado="valor"` para estilizar (aba ativa, item marcado) |

## Reforço visual (acompanham o zoom)
| Função | O que faz |
|---|---|
| `K.destacar(alvo, t0, t1, {forma, pad})` | `"anel"` (contorno na cor de destaque) ou `"foco"` (escurece o resto) |
| `K.nota(alvo, "texto", t0, t1, {lado, titulo})` | balão ao lado do alvo: `"direita"`, `"esquerda"`, `"cima"`, `"baixo"`. Nunca sobre o alvo |
| `K.aviso("texto", t0, t1, {tipo})` | faixa no alto: `"dica"` ou `"atencao"` (onde as pessoas erram) |
| `K.sucesso("texto", t0, t1)` | confirmação do kit, só quando o sistema não tem o próprio aviso |

## Estrutura
| Função | O que faz |
|---|---|
| `K.abertura({titulo, subtitulo, passosEm, logo}, t0, t1)` | cartela cheia: produto, título, passos entrando um a um (ancore `passosEm` nas palavras da abertura) |
| `K.passo(n, t, {titulo})` | passo atual na barra + progresso; `titulo: false` dispensa a cartela |
| `K.cartelaPasso(n, t0, t1)` | só a cartela do passo |
| `K.capitulo(n, "título", t0, t1)` | cartela cheia de parte (tutoriais com 2 partes) |
| `K.encerramento({titulo, itens, marcasEm, rodape}, t0, t1?)` | recapitulação com os passos ticando |
| `K.semLegenda(t0, t1)` | esconde a legenda num trecho |
| `K.sfx(nome, t, vol)` | efeito avulso (raro: as ações já tocam o delas) |

Sons: `clique`, `passar`, `selecao`, `transicao`, `destaque`, `sucesso`, `soltar`, `carta`, `type`, `swoosh`,
`whoosh`, `pop`, `ding`, `tick`.

## Medidas do palco
1920 × 1080. Janela do sistema em x 200–1720, y 40–892 (barra de 44 px; área da tela 1520 × 808). Legenda em
y 930–1000. O zoom põe o alvo em (960, 450), acima da legenda; ajuste com `foco: {x, y}`.

## Erros comuns
- **Ação antes da fala:** o clique tem de cair na palavra do rótulo, não no começo do segmento.
- **Zoom em tudo:** zoom é para alvo pequeno. Tela inteira em plano geral é normal e orienta.
- **Esquecer o `K.geral`** antes de mudar de região: a câmera viaja aproximada e desorienta.
- **Nota sobre o campo:** escolha o `lado` com espaço livre; confira no snapshot.
- **Duas coisas ao mesmo tempo:** destaque, nota e aviso juntos poluem. Um reforço por vez.
- **Seletor frágil** (`div > div:nth-child(7)`): prefira `id`, `name`, `data-testid` ou o texto do botão
  (no `capturar.json`, `text=Salvar`).
- **Mexer no kit para um vídeo:** não. Se faltou uma peça, ela entra no kit para todos os vídeos.
