# 3 · Telas e tema

A janela do vídeo tem 1520 × 808 px de área útil (mais a barra de 44 px com a rota e o passo). As telas do sistema
são desenhadas na largura de `tutorial.json → telaLargura` (1440 por padrão, a 765 px de altura) e escaladas para
caber. Cada **estado** que o vídeo mostra é uma tela: lista, formulário vazio, lista depois de salvar.
Peças pequenas que aparecem por cima (um menu aberto, um aviso, uma linha nova) podem ser elementos ocultos da
mesma tela, revelados por `K.mostrar`.

## Caminho A · capturar o sistema rodando (preferido)
É o "mostre a coisa de verdade" do /brag: a interface real, com o CSS real, sem redesenho.
1. Suba o sistema localmente **com dados de teste** (seed/fixtures do projeto ou dados fictícios criados agora).
   Nunca capture produção nem uma base com clientes reais (T2). A ferramenta só aceita `localhost`, `127.0.0.1`,
   `*.localhost` e `*.test`.
2. Se tiver login, use um usuário de teste do próprio projeto (seed). A pessoa faz o login uma vez e as
   ações do `capturar.json` seguem dali. Nunca digite uma senha real.
3. Escreva `motor/telas/capturar.json`:
   ```json
   { "base": "http://localhost:5173", "largura": 1440,
     "telas": [
       { "id": "lista", "rota": "/produtos", "rotaExibida": "app/produtos", "esperar": "table" },
       { "id": "novo",  "rota": "/produtos", "rotaExibida": "app/produtos/novo",
         "acoes": [ {"clicar": "text=Novo produto"}, {"esperar": "form"} ] },
       { "id": "salvo", "rota": "/produtos", "acoes": [ {"clicar": "text=Novo produto"},
           {"preencher": ["#nome", "Garrafa térmica Aurora"]}, {"clicar": "text=Salvar produto"}, {"esperar": ".toast"} ] }
     ] }
   ```
   `acoes`: `clicar`, `preencher` [seletor, texto], `selecionar` [seletor, valor], `esperar`, `pausa` (ms).
   `rotaExibida` é o que aparece na barra da janela (sem host interno nem porta).
4. `node ferramentas/capturar.mjs telas/capturar.json` escreve `telas/<id>.html`, `telas/sistema.css`
   (o CSS do sistema escopado em `#telas`, com `vh`/`vw` convertidos), `telas/arquivos/` (imagens e fontes) e
   `telas/telas.json`. Também grava `telas/ref/<id>.png`, a tela como o navegador mostrou, para comparar.
5. Abra 2 ou 3 telas no snapshot e compare com `telas/ref/`. Diferenças comuns: fonte carregada por script (copie
   o `@font-face`), ícone desenhado por JS (troque por SVG do próprio projeto), conteúdo que só aparece com
   rolagem (capture com `pausa` ou divida em duas telas).
6. **Releia o HTML capturado procurando dados pessoais** (T2): e-mails, nomes de clientes, documentos. O
   `verificar.py` também procura.

## Caminho B · recriar do código
Quando o sistema não roda na máquina (banco remoto, serviço pago, app mobile). Recrie cada tela em
`motor/telas/<id>.html` + um `telas/sistema.css`:
- Mesma estrutura dos componentes (menu, cabeçalho, tabela, formulário), mesmos textos, mesma ordem de campos,
  mesmas cores e fontes. Copie as classes e os tokens do CSS do projeto em vez de inventar.
- Escope todo seletor em `#telas` (`#telas .botao{…}`) e use `.k-html`/`.k-body` como raiz (veja o exemplo).
- Imagens e ícones do próprio projeto vão em `telas/arquivos/` (referência `arquivos/x.svg`).
- Declare no `plano.md` que as telas foram recriadas do código.

## telas/telas.json
```json
[ { "id": "lista", "arquivo": "lista.html", "rota": "app/produtos", "largura": 1440, "css": ["sistema.css"] } ]
```
O `id` é o que as cenas usam (`K.tela("lista", t)`). A ordem não importa.

## Estados dentro de uma tela
- Elemento que só aparece depois (modal, menu de contexto, aviso, linha nova): coloque-o no HTML com a classe
  `k-oculto` e posição absoluta, e revele com `K.mostrar("#modal", t, { de: "escala" })`.
- Estado visual de um elemento (aba ativa, botão selecionado): `K.estado("#aba-2", "ativo", t)` + CSS
  `#telas [data-k-estado="ativo"]{…}`.
- Lista suspensa nativa (`<select>`): não precisa desenhar nada, `K.lista` desenha o menu aberto com as opções reais.
- Mudou muita coisa (outra página, formulário enviado)? É outra tela (`K.tela`).

## tema.json (cores e fontes do sistema)
```json
{ "fundo": "#10242c", "fundoProfundo": "#081619", "superficie": "#1c3b45", "texto": "#ffffff",
  "destaque": "#0f8b7a", "apoio": "#7fe0cf", "mudo": "#9fbcb8",
  "fonteTitulo": "Inter", "fonteTexto": "Inter",
  "fontes": [ { "familia": "Inter", "arquivo": "telas/arquivos/Inter.woff2", "peso": "100 900" } ] }
```
- `fundo`/`fundoProfundo`: o palco em volta da janela, as cartelas e os balões. Um tom escuro da marca funciona
  melhor: a janela clara do sistema se destaca.
- `superficie`: a barra da janela. `destaque`: cliques, anéis, progresso. `apoio`: rótulos na legenda, números
  dos passos. `mudo`: textos secundários.
- Fontes só com arquivo local (licença do projeto). Sem `tema.json`, vale a pele nativa da reel (roxo, Anybody +
  Plus Jakarta Sans).
- Confira contraste: texto sobre `fundo` e `apoio` sobre o fundo da legenda (quase preto) precisam ser legíveis.
