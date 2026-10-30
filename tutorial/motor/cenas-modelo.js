// =====================================================================================================
// CENAS · <título do tutorial>
// Uma chamada K.* por ação, em ordem cronológica, sempre ancorada na fala. Leia referencias/5-cenas.md e
// motor/exemplo/cenas.js inteiro antes. Tempos: K.seg("id") · K.segFim("id") · K.em("id", "frase") · K.at("frase").
// =====================================================================================================

// ---------- abertura ----------
K.tela("<primeira tela>", 0, { transicao: "corte" });
K.abertura({
  titulo: "<Como fazer X>",
  subtitulo: "<o resultado, em uma linha>",
  passosEm: [/* K.em("abertura-2", "<passo 1 falado>"), … um por passo */],
}, 0, K.segFim("abertura-<último>") + 0.35);

// ---------- passo 1 · <título> ----------
K.passo(1, K.seg("p1-a"));
// K.destacar("<região que a voz descreve>", K.em("p1-a", "<frase>"), K.segFim("p1-a") + 0.2);
// K.clicar("<seletor>", K.em("p1-b", "<rótulo>"));
// K.tela("<próxima tela>", K.em("p1-b", "<rótulo>") + 0.35);

// ---------- passo 2 · <título> ----------
// K.passo(2, K.seg("p2-a"));
// K.foco("<alvo pequeno>", K.em("p2-a", "<frase>"), { zoom: 1.6 });
// K.digitar("<campo>", "<texto fictício>", K.em("p2-b", "<primeira palavra do texto>"));
// K.lista("<select>", ["<opções reais>"], "<escolha>", K.em("p2-c", "<escolha>"));
// K.geral(K.segFim("p2-c") + 0.4);

// ---------- encerramento ----------
// K.encerramento({ titulo: "<resultado>", marcasEm: [/* um por passo */] }, K.seg("fim-1") - 0.2);
// K.cursor(false, K.seg("fim-1") - 0.2);
