// =====================================================================================================
// CENAS · "Como cadastrar um produto no Lumen Estoque" (exemplo da skill tutorial — sistema fictício)
// Uma chamada K.* por ação, sempre ancorada na fala (K.seg / K.em / K.at). Ordem cronológica.
// =====================================================================================================

// ---------- abertura ----------
K.tela("painel", 0, { transicao: "corte" });
K.abertura({
  titulo: "Como cadastrar um produto",
  subtitulo: "Do menu ao produto salvo, em quatro passos",
  passosEm: [K.em("abertura-2", "abrir a lista"), K.em("abertura-2", "começar um produto"), K.em("abertura-2", "preencher os dados"), K.em("abertura-2", "salvar")],
}, 0, K.segFim("abertura-3") + 0.35);

// ---------- passo 1 · abrir a lista de produtos ----------
K.passo(1, K.seg("p1-a"));
K.destacar(".cards", K.em("p1-a", "resumo do estoque"), K.segFim("p1-a") + 0.2, { forma: "anel" });
K.foco(".cards", K.em("p1-b", "quantos produtos"), { zoom: 1.5 });
K.nota(".cards .card:nth-child(2)", "Fica vermelho quando algo está acabando", K.em("p1-b", "estoque baixo"), K.segFim("p1-b") + 0.4, { lado: "baixo", titulo: "Estoque baixo" });
K.geral(K.seg("p1-c") + 0.2);
K.destacar("aside", K.em("p1-c", "menu lateral"), K.em("p1-c", "clique em") - 0.1, { forma: "foco", pad: 0 });
K.clicar('aside a[href="produtos.html"]', K.em("p1-c", "produtos"));
K.tela("produtos", K.em("p1-c", "produtos") + 0.35);

// ---------- passo 2 · começar um produto novo ----------
K.passo(2, K.seg("p2-a"));
K.foco("#tabela thead", K.em("p2-a", "nome categoria"), { zoom: 1.4 });
K.foco(".tag.baixo", K.em("p2-b", "etiqueta vermelha"), { zoom: 1.8 });
K.destacar(".tag.baixo", K.em("p2-b", "etiqueta vermelha") + 0.1, K.segFim("p2-b") + 0.3, { forma: "anel", pad: 6 });
K.geral(K.seg("p2-c") + 0.1);
K.destacar("#novo-produto", K.em("p2-c", "novo produto"), K.segFim("p2-c"), { forma: "anel", pad: 6 });
K.clicar("#novo-produto", K.em("p2-c", "novo produto") + 0.25);
K.tela("novo", K.segFim("p2-c") + 0.2);

// ---------- passo 3 · preencher os dados ----------
K.passo(3, K.seg("p3-a"));
K.foco(".form", K.em("p3-a", "nome do produto"), { zoom: 1.45, foco: { x: 960, y: 470 } });
K.destacar("#nome", K.em("p3-a", "nome do produto") + 0.3, K.seg("p3-b"), { forma: "anel", pad: 4 });
K.digitar("#nome", "Garrafa térmica Aurora", K.em("p3-b", "garrafa"));
K.lista("#categoria", ["Selecione", "Cozinha", "Iluminação", "Banho", "Decoração"], "Cozinha", K.em("p3-c", "cozinha"), { destaqueDe: K.em("p3-c", "abra a lista") });
K.digitar("#preco", "89,90", K.em("p3-d", "oitenta"), { cps: 5 });
K.digitar("#qtd", "30", K.em("p3-e", "trinta"), { cps: 4 });
K.foco("#sku", K.em("p3-f", "o campo do código"), { zoom: 1.45 });   // abre espaço à direita para o balão
K.mover("#sku", K.em("p3-f", "o campo do código") + 0.2, { dx: -120 });
K.nota("#sku", "Deixe em branco: o código é gerado", K.em("p3-f", "em branco"), K.segFim("p3-f") + 0.5);

// ---------- passo 4 · salvar e conferir ----------
K.passo(4, K.seg("p4-a"), { titulo: false });
K.foco("#salvar", K.em("p4-a", "confira"), { zoom: 1.45, d: 1.0, foco: { x: 960, y: 470 } });
K.clicar("#salvar", K.em("p4-a", "salvar produto"));
K.tela("salvo", K.em("p4-a", "salvar produto") + 0.3, { transicao: "corte" });
K.geral(K.em("p4-a", "salvar produto") + 0.35, { d: 0 });
K.destacar(".toast", K.em("p4-b", "produto cadastrado"), K.segFim("p4-b") + 0.3, { forma: "anel", pad: 6 });
K.foco("tr.novo", K.em("p4-c", "topo da lista"), { zoom: 1.5 });
K.destacar("tr.novo", K.em("p4-c", "topo da lista") + 0.1, K.segFim("p4-c") + 0.3, { forma: "anel", pad: 2 });
K.geral(K.segFim("p4-c") + 0.6);

// ---------- encerramento ----------
K.encerramento({
  titulo: "Produto cadastrado",
  itens: ["Abrir Produtos", "Clicar em Novo produto", "Preencher os dados", "Salvar e conferir"],
  marcasEm: [K.em("fim-1", "abra produtos"), K.em("fim-1", "clique em novo"), K.em("fim-1", "preencha"), K.em("fim-1", "salve")],
  rodape: "Lumen Estoque · exemplo fictício",
}, K.seg("fim-1") - 0.2);
K.cursor(false, K.seg("fim-1") - 0.2);
