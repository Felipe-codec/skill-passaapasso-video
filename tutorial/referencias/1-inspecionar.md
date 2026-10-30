# 1 · Inspecionar o sistema

Leia o projeto para entender o que o vídeo vai ensinar. Diferente do /brag, que procura o momento mais
impressionante, aqui você procura **o caminho exato** que uma pessoa faz para concluir uma tarefa: cada tela, cada
clique, cada campo, cada mensagem.

## O que ler (em ordem)
1. **Rotas e telas:** `app/`, `pages/`, `src/routes`, arquivos de rota, menus e navegação (sidebar, navbar, abas).
   Monte a lista de telas e de como se chega a cada uma.
2. **A tarefa:** os componentes da tarefa escolhida. Formulários (campos, ordem, obrigatórios, máscaras,
   valores padrão), botões (texto exato), modais, listas suspensas (opções reais), validações e mensagens de erro,
   o que acontece ao salvar (aviso de sucesso, redirecionamento, linha nova na lista).
3. **Textos da interface:** rótulos, placeholders, títulos e mensagens, tirados do código **como estão escritos**
   (maiúsculas, acentos). Se o sistema usa i18n, leia o arquivo de traduções em pt-BR.
4. **Estado e permissões:** a tarefa exige um perfil (admin)? um dado prévio (um cliente cadastrado antes)? isso
   vira pré-requisito no roteiro.
5. **Estilo:** o CSS ou os tokens do tema (`:root`, `tailwind.config`, `theme.ts`): fundo, superfície, texto, cor
   da marca, fontes (títulos e texto). Vira `tema.json` (`referencias/3-telas.md`).
6. **README / docs / testes de ponta a ponta:** testes e2e (Playwright, Cypress) descrevem o caminho de cliques
   da tarefa com seletores reais; são a melhor fonte para o roteiro **e** para os seletores das cenas.
7. **Seeds / fixtures:** dados de exemplo do próprio projeto, que viram os dados fictícios do vídeo.
8. **Como rodar localmente:** script `dev`, porta, banco de teste e seed. Decide se as telas serão capturadas ou
   recriadas.

Não leia: build (`dist/`, `.next/`, `build/`), lock files, `.git/`, `.env*`, chaves (`.pem`, `.key`, `id_rsa`,
JSON de conta de serviço), `secrets/`, `credentials/`, nem o que o `.gitignore` exclui por esses motivos (T2).

## Escolher a tarefa
Um tutorial ensina **uma** tarefa, com começo, meio e fim verificável ("o produto aparece na lista"). Se a pessoa
não disse qual e o sistema tem várias, pergunte **uma vez**, com 3 a 5 candidatas tiradas do código, na ordem em
que um usuário novo precisaria delas:
> "Achei estas tarefas no sistema: 1) cadastrar produto, 2) registrar entrada de estoque, 3) emitir relatório
> mensal, 4) cadastrar fornecedor. Qual vira o tutorial? (Se quiser uma série, faço uma de cada vez.)"

## As 10 perguntas (escreva as respostas em `inspecao.md` antes do roteiro)
```
1. Qual é a tarefa?            Uma frase com verbo: "cadastrar um produto novo".
2. Quem assiste?               Perfil e o que já sabe (equipe nova, cliente final, suporte).
3. Pré-requisitos              Login, perfil, dado que precisa existir antes, onde o sistema roda.
4. Ponto de partida            A tela onde o vídeo começa (normalmente a primeira tela depois do login).
5. O caminho                   Lista numerada: tela → ação (rótulo exato) → resultado. Cada clique e cada campo.
6. Os passos                   O caminho agrupado em 3 a 6 passos com título curto ("Preencher os dados").
7. Onde as pessoas erram       Campo obrigatório escondido, formato de data/valor, botão parecido, permissão.
                               Vira aviso (K.aviso) ou balão (K.nota) no vídeo.
8. Resultado verificável       Como a pessoa sabe que deu certo (aviso, linha nova, status mudou).
9. Telas a mostrar             Uma por estado (lista, formulário vazio, formulário preenchido se precisar,
                               depois de salvar) e se cada uma será capturada ou recriada.
10. Identidade                 Fundo, superfície, texto, destaque, fontes (valores exatos do CSS).
```

## Seletores
Anote, para cada ação do caminho, o seletor estável do alvo: `id`, `data-testid`, `aria-label`, `name` do
campo, ou um caminho curto (`aside a[href="/produtos"]`). Os testes e2e costumam ter os melhores. São eles que
vão para o `K.clicar`/`K.digitar` das cenas.

## Dados fictícios
Escolha agora os dados que serão digitados e exibidos: coerentes com o negócio, sem nome real de cliente ou
pessoa, com e-mails `@exemplo.com`, documentos de teste e valores redondos e plausíveis. Liste-os no `plano.md`.
