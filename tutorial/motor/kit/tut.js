/* =====================================================================================================
   TUTORIAL 16:9 — biblioteca de motion (HyperFrames + GSAP). Mesma arquitetura do kit VSL da skill reel:
   todas as funções só AGENDAM tweens num timeline pausado (seek-safe, determinístico) e toda entrada é
   ancorada na fala (K.at). Uso no index (montar.mjs faz isso):
       const K = TUT.init({ tl, cfg: CFG, words: WORDS, segs: SEGS });
       K.tela("lista", 0, { transicao: "corte" });
       K.clicar("#novo-cliente", K.at("clique em novo cliente"));
   Regra de ouro: as ações acontecem NO tempo t (o clique estala em t, a digitação começa em t, o zoom chega em t).
   Seletores que não existem lançam erro — nunca chute um alvo, assim como nunca se chuta um tempo.
   ===================================================================================================== */
(function () {
  const W = 1920, H = 1080;
  // janela do sistema (coordenadas do palco)
  const JX = 200, JY = 40, JW = 1520, BARRA = 44, VH = 808;      // viewport da tela: 1520 × 808
  const JH = BARRA + VH;                                          // 852 → a janela termina em y 892
  const FOCO = { x: 960, y: 450 };                                // onde o zoom põe o alvo (acima da legenda)

  const $ = (s, raiz = document) => (typeof s === "string" ? raiz.querySelector(s) : s);
  const mk = (pai, cls, html, estilo) => {
    const e = document.createElement("div");
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (estilo) Object.assign(e.style, estilo);
    $(pai).appendChild(e);
    return e;
  };
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9%$ ]+/g, " ").trim();
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const ICONES = {
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    dica: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
    atencao: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z"/>',
  };
  const icone = (n) => `<svg viewBox="0 0 24 24">${ICONES[n] || ICONES.dica}</svg>`;

  // duração dos efeitos (kit/sfx): procedurais da reel + Kenney (CC0) via brag
  const SFX_DUR = { clique: 0.06, passar: 0.06, selecao: 0.06, transicao: 0.18, destaque: 0.12, sucesso: 1.48, soltar: 0.19,
    carta: 0.6, type: 1.0, swoosh: 0.4, whoosh: 0.6, pop: 0.12, ding: 0.8, tick: 0.04 };

  function init({ tl, cfg = {}, words = [], segs = [] }) {
    const C = Object.assign({ dur: 60, sfx: true, sfxVol: 0.5, legenda: true, zoom: 1.65, passos: [], rotas: {} }, cfg);
    const K = { tl, cfg: C, mk, icone, W, H, JANELA: { x: JX, y: JY, w: JW, barra: BARRA, h: VH } };
    const set = (alvo, v, t) => tl.set(alvo, v, t);
    const fromTo = (alvo, a, b, t) => tl.fromTo(alvo, a, Object.assign({ immediateRender: false }, b), t);
    K.set = set; K.fromTo = fromTo;
    K.to = (alvo, v, t) => tl.to(alvo, v, t);
    /** troca seek-safe de qualquer coisa que não é tween (texto, valor de input): antes de t → antes(), depois → depois() */
    const troca = (t, antes, depois) => {
      const p = { v: 0 };
      tl.to(p, { v: 1, duration: 0.001, ease: "none", onUpdate() { (p.v >= 0.5 ? depois : antes)(); } }, t);
    };
    K.troca = troca;

    // ------------------------------------------------------------ tempo das palavras (mesmo contrato da reel)
    const WN = words.map((w) => ({ n: norm(w.text), s: w.start, e: w.end })).filter((w) => w.n);
    const achar = (frase, nth = 1, depois = 0) => {
      const p = norm(frase).split(/\s+/);
      let hit = 0;
      for (let i = 0; i <= WN.length - p.length; i++) {
        if (WN[i].s < depois) continue;
        let ok = true;
        for (let j = 0; j < p.length; j++) if (WN[i + j].n.replace(/ /g, "") !== p[j]) { ok = false; break; }
        if (ok && ++hit === nth) return WN.slice(i, i + p.length);
      }
      return null;
    };
    /** início (s) da frase falada. Lança erro se não achar. */
    K.at = (frase, nth = 1, depois = 0) => {
      const r = achar(frase, nth, depois);
      if (!r) throw new Error(`TUT.at: frase não encontrada na narração: "${frase}" (#${nth})`);
      return r[0].s;
    };
    K.end = (frase, nth = 1, depois = 0) => { const r = achar(frase, nth, depois); if (!r) throw new Error(`TUT.end: "${frase}"`); return r[r.length - 1].e; };
    K.wt = (frase, nth = 1, depois = 0) => { const r = achar(frase, nth, depois); return r ? r.map((w) => w.s) : null; };
    K.has = (frase) => !!achar(frase);
    const SEG = Object.fromEntries(segs.map((s) => [s.id, s]));
    /** início/fim de um segmento do roteiro (âncora estável mesmo se a frase se repetir) */
    K.seg = (id) => { if (!SEG[id]) throw new Error(`TUT.seg: segmento não existe: "${id}"`); return SEG[id].start; };
    K.segFim = (id) => { if (!SEG[id]) throw new Error(`TUT.segFim: "${id}"`); return SEG[id].end; };
    /** a frase dentro de um segmento: K.em("passo2-a", "salvar") */
    K.em = (id, frase, nth = 1) => K.at(frase, nth, K.seg(id) - 0.01);

    // ------------------------------------------------------------ SFX (áudio criado em runtime funciona no render)
    let nSfx = 0, ultimoPequeno = -9;
    const fimTrilha = {};
    const PEQUENOS = ["passar", "selecao", "pop", "tick", "carta", "destaque"];
    K.sfx = (nome, t, vol = 0.5) => {
      if (!C.sfx || t == null || t < 0) return;
      if (PEQUENOS.includes(nome)) { if (t - ultimoPequeno < 0.6) return; ultimoPequeno = t; }  // parcimônia (R2 da reel)
      const d = SFX_DUR[nome] || 0.5;
      let tr = 40;
      while ((fimTrilha[tr] || -1) > t) tr++;
      fimTrilha[tr] = t + d + 0.01;
      const a = document.createElement("audio");
      a.id = "sfx" + ++nSfx;
      a.src = `assets/sfx/${nome}.wav`;
      a.setAttribute("data-start", t.toFixed(3));
      a.setAttribute("data-duration", d.toFixed(3));
      a.setAttribute("data-track-index", String(tr));
      a.setAttribute("data-volume", String(+(vol * C.sfxVol).toFixed(3)));
      $("#tut").appendChild(a);
    };

    // ============================================================ MEDIDAS (alvos na tela)
    const raiz = $("#tut"), cam = $("#cam");
    const escalaPalco = () => raiz.getBoundingClientRect().width / W || 1;
    const rolagem = new Map();   // contêiner → rolagem atual (px da tela), na ordem em que as cenas são escritas
    /** elemento-alvo. Aceita seletor (procura na tela ativa, depois em todas) ou elemento. Erro se não existir. */
    const alvo = (sel, tela) => {
      if (typeof sel !== "string") return sel;
      const r = (tela && $("#tela-" + tela)) || $("#tela-" + K.telaAtual) || document;
      const e = r.querySelector(sel) || document.querySelector("#telas " + sel);
      if (!e) throw new Error(`TUT: alvo não encontrado: "${sel}"${tela || K.telaAtual ? ` (tela ${tela || K.telaAtual})` : ""}`);
      return e;
    };
    K.alvo = alvo;
    /** caixa do elemento em coordenadas da câmera (= do palco com a câmera em repouso), já descontada a rolagem */
    const caixa = (sel, tela) => {
      const e = alvo(sel, tela), k = escalaPalco();
      // mede com câmera, janela e rolagens em repouso (o GSAP pode já ter escrito transforms no momento da montagem)
      const neutros = [cam, $("#janela"), ...rolagem.keys()].map((n) => [n, n.style.transform]);
      neutros.forEach(([n]) => (n.style.transform = "none"));
      const rc = cam.getBoundingClientRect(), r = e.getBoundingClientRect();
      neutros.forEach(([n, v]) => (n.style.transform = v));
      let dy = 0;
      rolagem.forEach((v, cont) => { if (cont.contains(e) && cont !== e) dy += v.y * v.esc; });
      return { x: (r.left - rc.left) / k, y: (r.top - rc.top) / k - dy, w: r.width / k, h: r.height / k };
    };
    K.caixa = caixa;
    const centro = (sel, tela) => { const c = caixa(sel, tela); return { x: c.x + c.w / 2, y: c.y + c.h / 2 }; };

    // ============================================================ CÂMERA (zoom e enquadramento)
    let camS = 1, camX = 0, camY = 0;
    const limita = (t, ini, tam, s, vista) => {
      const a = vista - (ini + tam) * s, b = -ini * s;          // janela cobre a vista: a ≤ t ≤ b
      return tam * s >= vista ? Math.min(b, Math.max(a, t)) : Math.min(a, Math.max(b, t));
    };
    /** zoom num alvo (seletor, elemento ou {x,y}) chegando em t. opt: zoom, d, foco {x,y} no palco */
    K.foco = (sel, t, opt = {}) => {
      const s = opt.zoom || C.zoom, d = opt.d ?? 0.9, F = opt.foco || FOCO;
      const p = sel && sel.x != null && sel.w == null ? sel : centro(sel, opt.tela);
      const x = limita(F.x - s * p.x, JX, JW, s, W);
      let y = limita(F.y - s * p.y, JY, JH, s, H);
      const topo = s * JY + y;                                    // onde fica o alto da janela no palco
      if (s > 1 && topo < 0 && topo > -s * BARRA)                 // barra inteira ou nada (nunca uma tira cortada)
        y -= topo > -s * BARRA / 2 || s * VH < H ? topo : topo + s * BARRA;
      if (d > 0) tl.to(cam, { x, y, scale: s, duration: d, ease: opt.ease || "power2.inOut" }, t - d);
      else set(cam, { x, y, scale: s }, t);
      camS = s; camX = x; camY = y;
      return t;
    };
    /** volta ao plano geral (janela inteira) chegando em t */
    K.geral = (t, opt = {}) => {
      const d = opt.d ?? 0.8;
      if (d > 0) tl.to(cam, { x: 0, y: 0, scale: 1, duration: d, ease: opt.ease || "power2.inOut" }, t - d);
      else set(cam, { x: 0, y: 0, scale: 1 }, t);
      camS = 1; camX = 0; camY = 0;
      return t;
    };
    /** aproximação lenta contínua (respiração) para trechos parados longos */
    K.respirar = (t, d, quanto = 0.03) => tl.to(cam, { scale: camS + quanto, x: camX - quanto * FOCO.x, y: camY - quanto * FOCO.y, duration: d, ease: "none" }, t);

    // ============================================================ TELAS
    K.telaAtual = null;
    const rotaSpans = {};
    const barraRota = $("#rota");
    document.querySelectorAll("#telas .tela").forEach((s) => {
      set(s, { opacity: 0 }, 0);
      const rota = s.dataset.rota || "";
      if (!rotaSpans[rota]) { rotaSpans[rota] = mk(barraRota, "k-rota", esc(rota)); set(rotaSpans[rota], { opacity: 0 }, 0); }
    });
    let rotaAtual = null;
    /** mostra a tela id em t. opt.transicao: "funde" (padrão) | "desliza" | "corte"; opt.d */
    K.tela = (id, t, opt = {}) => {
      const nova = $("#tela-" + id);
      if (!nova) throw new Error(`TUT.tela: tela não existe: "${id}" (veja telas/telas.json)`);
      const velha = K.telaAtual && $("#tela-" + K.telaAtual);
      const tipo = opt.transicao || (velha ? "funde" : "corte"), d = tipo === "corte" ? 0 : opt.d ?? 0.45;
      if (d === 0) { if (velha) set(velha, { opacity: 0 }, t); set(nova, { opacity: 1, x: 0 }, t); }
      else if (tipo === "desliza") {
        if (velha) tl.to(velha, { x: -80, opacity: 0, duration: d, ease: "power2.in" }, t);
        fromTo(nova, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: d, ease: "power2.out" }, t + d * 0.4);
      } else {
        if (velha) tl.to(velha, { opacity: 0, duration: d * 0.6, ease: "power1.in" }, t);
        fromTo(nova, { opacity: 0 }, { opacity: 1, duration: d * 0.7, ease: "power1.out" }, t + d * 0.3);
      }
      const rota = nova.dataset.rota || "";
      if (rota !== rotaAtual) {
        if (rotaAtual != null) set(rotaSpans[rotaAtual], { opacity: 0 }, t);
        set(rotaSpans[rota], { opacity: 1 }, t);
        rotaAtual = rota;
      }
      if (velha && d > 0 && opt.sfx !== false) K.sfx(tipo === "desliza" ? "swoosh" : "transicao", t, 0.25);
      K.telaAtual = id;
      return t + d;
    };
    /** rola um contêiner (a tela inteira por padrão) até y (px da tela) chegando em t */
    K.rolar = (y, t, opt = {}) => {
      const tela = $("#tela-" + (opt.tela || K.telaAtual));
      const cont = opt.alvo ? alvo(opt.alvo) : tela.querySelector(".rolagem");
      const d = opt.d ?? 0.8, esc = parseFloat(tela.querySelector(".escala").dataset.escala) || 1;
      tl.to(cont, { y: -y, duration: d, ease: "power2.inOut" }, t - d);
      rolagem.set(cont, { y, esc });
      return t;
    };

    // ============================================================ CURSOR
    const cursor = $("#cursor");
    let cur = { x: JX + JW * 0.62, y: JY + BARRA + VH * 0.55 }, curVisivel = false;
    set(cursor, { x: cur.x, y: cur.y, opacity: 0 }, 0);
    /** mostra/esconde o cursor em t */
    K.cursor = (visivel, t, opt = {}) => {
      if (opt.em) { const p = centro(opt.em); cur = p; set(cursor, { x: p.x, y: p.y }, t); }
      tl.to(cursor, { opacity: visivel ? 1 : 0, duration: 0.2 }, t);
      curVisivel = visivel;
    };
    /** move o cursor até o alvo chegando em t. opt: d, dx, dy (deslocamento a partir do centro), tela */
    K.mover = (sel, t, opt = {}) => {
      const p = sel && sel.x != null && sel.w == null ? sel : centro(sel, opt.tela);
      const x = p.x + (opt.dx || 0), y = p.y + (opt.dy || 0);
      const dist = Math.hypot(x - cur.x, y - cur.y), d = opt.d ?? Math.min(1.0, Math.max(0.35, dist / 1400));
      if (!curVisivel) K.cursor(true, t - d - 0.2);
      tl.to(cursor, { x, y, duration: d, ease: "power2.inOut" }, t - d);
      cur = { x, y };
      return t;
    };
    /** clique: o cursor chega um instante antes e o clique estala exatamente em t. opt: semMover, efeito(t) */
    K.clicar = (sel, t, opt = {}) => {
      if (!opt.semMover) K.mover(sel, t - 0.12, opt);
      tl.to(cursor, { scale: 0.82, duration: 0.07, ease: "power2.out" }, t - 0.03);
      tl.to(cursor, { scale: 1, duration: 0.18, ease: "back.out(3)" }, t + 0.07);
      const anel = mk("#marcas", "k-clique", "", { left: cur.x - 22 + "px", top: cur.y - 22 + "px" });
      fromTo(anel, { scale: 0.3, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.5, ease: "power2.out" }, t);
      if (sel && typeof sel === "string" && opt.pressionar !== false) {
        const e = alvo(sel, opt.tela);
        tl.to(e, { scale: 0.97, duration: 0.07 }, t - 0.02); tl.to(e, { scale: 1, duration: 0.15 }, t + 0.06);
      }
      K.sfx("clique", t, 0.6);
      if (opt.efeito) opt.efeito(t + 0.1);
      return t;
    };
    /** digita texto num campo (input/textarea: value; outros: texto) começando em t. opt: cps (letras/s), clicar */
    K.digitar = (sel, texto, t, opt = {}) => {
      const e = alvo(sel, opt.tela), cps = opt.cps || 14, d = Math.max(0.3, texto.length / cps);
      if (opt.clicar !== false) K.clicar(sel, t - 0.25, Object.assign({ pressionar: false }, opt));
      const campo = "value" in e && e.tagName !== "BUTTON" && e.tagName !== "SELECT";
      const inicial = campo ? e.value : e.textContent;
      const p = { n: 0 };
      tl.to(p, { n: texto.length, duration: d, ease: "none", onUpdate() {
        const s = p.n <= 0.001 ? inicial : texto.slice(0, Math.max(1, Math.round(p.n)));
        if (campo) e.value = s; else e.textContent = s;
      } }, t);
      set(e, { attr: { "data-k-foco": "1" } }, t - 0.25);
      set(e, { attr: { "data-k-foco": "0" } }, t + d + 0.5);
      // digitação contínua (amostra natural da reel, ~1 s por trecho)
      for (let k = 0; k < d; k += 1.0) K.sfx("type", t + k, 0.35);
      return t + d;
    };
    /** escolhe uma opção num menu já desenhado na tela (oculto com .k-oculto): abre, clica a opção, fecha */
    K.escolher = (selMenu, selOpcao, t, opt = {}) => {
      if (opt.abrirEm !== false) K.clicar(opt.gatilho || selMenu, t - 0.9, opt);
      K.mostrar(selMenu, t - 0.75, { de: "cima", d: 0.2 });
      K.mover(selOpcao, t - 0.12, { d: 0.45 });
      K.clicar(selOpcao, t, { semMover: true, pressionar: false });
      K.esconder(selMenu, t + 0.25);
      if (opt.valor && opt.gatilho) K.texto(opt.campoValor || opt.gatilho, opt.valor, t + 0.25);
      return t + 0.25;
    };

    /** lista suspensa de um <select> (ou de qualquer campo de escolha): o kit desenha o menu aberto logo abaixo do
     *  campo, com as opções reais, o cursor clica a escolhida em t e o campo passa a mostrá-la. opt: valor (o que o
     *  campo mostra depois; padrão = escolha), destaqueDe (início do clique no campo; padrão t − 1,1) */
    K.lista = (sel, opcoes, escolha, t, opt = {}) => {
      const e = alvo(sel, opt.tela), c = caixa(sel, opt.tela);
      const i = opcoes.indexOf(escolha);
      if (i < 0) throw new Error(`TUT.lista: "${escolha}" não está nas opções de ${sel}`);
      const tela = e.closest(".tela"), ez = parseFloat(tela.querySelector(".escala").dataset.escala) || 1;
      const cs = getComputedStyle(e), alt = Math.round(38 * ez);
      const menu = mk("#marcas", "k-lista", opcoes.map((o, k) => `<div class="${k === i ? "k-esc" : ""}" style="height:${alt}px;line-height:${alt}px">${esc(o)}</div>`).join(""),
        { left: c.x + "px", top: c.y + c.h + 4 + "px", width: c.w + "px", fontFamily: cs.fontFamily, fontSize: parseFloat(cs.fontSize) * ez + "px", borderRadius: 8 * ez + "px" });
      const t0 = opt.destaqueDe ?? t - 1.1;
      K.clicar(sel, t0, { pressionar: false });
      fromTo(menu, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, t0 + 0.12);
      const item = menu.children[i];
      K.mover({ x: c.x + c.w * 0.35, y: c.y + c.h + 4 + alt * (i + 0.5) }, t - 0.12, { d: Math.max(0.35, t - 0.12 - t0 - 0.3) });
      set(item, { attr: { "data-k-estado": "sobre" } }, t - 0.2);
      K.clicar(null, t, { semMover: true });
      tl.to(menu, { opacity: 0, duration: 0.15 }, t + 0.18);
      K.texto(sel, opt.valor ?? escolha, t + 0.18, opt);
      return t + 0.2;
    };
    
    // ============================================================ ESTADOS DA TELA
    /** mostra um elemento que a tela traz oculto (.k-oculto): modal, menu, aviso, linha nova */
    K.mostrar = (sel, t, opt = {}) => {
      const e = alvo(sel, opt.tela), d = opt.d ?? 0.3;
      const de = { opacity: 0 }, para = { opacity: 1, duration: d, ease: "power2.out" };
      if (opt.de === "baixo") { de.y = 16; para.y = 0; }
      if (opt.de === "cima") { de.y = -10; para.y = 0; }
      if (opt.de === "escala") { de.scale = 0.94; para.scale = 1; para.ease = "back.out(1.6)"; }
      fromTo(e, de, para, t);
      if (opt.sfx) K.sfx(opt.sfx, t, 0.35);
      return t + d;
    };
    K.esconder = (sel, t, opt = {}) => { tl.to(alvo(sel, opt.tela), { opacity: 0, duration: opt.d ?? 0.2, ease: "power1.in" }, t); return t; };
    /** troca o texto de um elemento em t (seek-safe) */
    K.texto = (sel, novo, t, opt = {}) => {
      const e = alvo(sel, opt.tela), campo = "value" in e && e.tagName !== "BUTTON";
      if (e.tagName === "SELECT" && ![...e.options].some((o) => o.value === novo)) {
        const o = document.createElement("option"); o.textContent = novo; o.value = novo; e.appendChild(o);  // valor fora da lista
      }
      const velho = campo ? e.value : e.textContent;
      troca(t, () => (campo ? (e.value = velho) : (e.textContent = velho)), () => (campo ? (e.value = novo) : (e.textContent = novo)));
      return t;
    };
    /** muda o estado visual: data-k-estado="valor" (estilize no CSS da tela: [data-k-estado="ativo"]{…}) */
    K.estado = (sel, valor, t, opt = {}) => { set(alvo(sel, opt.tela), { attr: { "data-k-estado": valor } }, t); return t; };

    // ============================================================ DESTAQUES (dentro da câmera: acompanham o zoom)
    /** destaca um alvo de t0 a t1. opt.forma: "foco" (escurece o resto) | "anel" (contorno pulsando); opt.pad */
    K.destacar = (sel, t0, t1, opt = {}) => {
      const c = caixa(sel, opt.tela), pad = opt.pad ?? 8, forma = opt.forma || "anel";
      const e = mk("#marcas", "k-" + forma, "", { left: c.x - pad + "px", top: c.y - pad + "px", width: c.w + pad * 2 + "px", height: c.h + pad * 2 + "px" });
      fromTo(e, { opacity: 0, scale: forma === "anel" ? 1.08 : 1 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out" }, t0);
      if (t1) tl.to(e, { opacity: 0, duration: 0.3 }, t1);
      if (opt.sfx !== false) K.sfx("destaque", t0, 0.3);
      return e;
    };
    /** balão explicativo preso a um alvo. opt.lado: "direita" | "esquerda" | "cima" | "baixo" */
    K.nota = (sel, texto, t0, t1, opt = {}) => {
      const c = caixa(sel, opt.tela), gap = 18;
      const e = mk("#marcas", "k-nota", `<b>${opt.titulo ? esc(opt.titulo) : ""}</b>${esc(texto)}`);
      // lado "auto" (padrão): o primeiro que cabe no que a câmera mostra agora (janela ∩ enquadramento, acima da legenda)
      const v = { x0: Math.max(JX, -camX / camS), x1: Math.min(JX + JW, (W - camX) / camS),
        y0: Math.max(JY + BARRA, -camY / camS), y1: Math.min(JY + JH, (910 - camY) / camS) };
      const cabe = { direita: c.x + c.w + gap + e.offsetWidth <= v.x1 - 8, esquerda: c.x - gap - e.offsetWidth >= v.x0 + 8,
        baixo: c.y + c.h + gap + e.offsetHeight <= v.y1 - 8, cima: c.y - gap - e.offsetHeight >= v.y0 + 8 };
      const lado = opt.lado && opt.lado !== "auto" ? opt.lado : ["direita", "esquerda", "baixo", "cima"].find((l) => cabe[l]) || "baixo";
      e.classList.add("k-" + lado);
      // posição por left/top medidos (sem transform em CSS: o GSAP anima x/y por cima)
      const w = e.offsetWidth, h = e.offsetHeight;
      const pos = { direita: [c.x + c.w + gap, c.y + c.h / 2 - h / 2], esquerda: [c.x - gap - w, c.y + c.h / 2 - h / 2],
        cima: [c.x + c.w / 2 - w / 2, c.y - gap - h], baixo: [c.x + c.w / 2 - w / 2, c.y + c.h + gap] }[lado];
      Object.assign(e.style, { left: pos[0] + "px", top: pos[1] + "px" });
      const dx = { direita: -12, esquerda: 12, cima: 0, baixo: 0 }[lado], dy = { cima: 10, baixo: -10, direita: 0, esquerda: 0 }[lado];
      fromTo(e, { opacity: 0, x: dx, y: dy }, { opacity: 1, x: 0, y: 0, duration: 0.35, ease: "power2.out" }, t0);
      if (t1) tl.to(e, { opacity: 0, duration: 0.25 }, t1);
      return e;
    };

    // ============================================================ SOBRE A JANELA (fora da câmera)
    const passos = C.passos || [];
    const indicadores = passos.map((p, i) => mk("#passoBarra", "k-passo-txt", `<span>Passo ${i + 1} de ${passos.length}</span>${esc(p.titulo)}`));
    indicadores.forEach((e) => set(e, { opacity: 0 }, 0));
    set("#progresso i", { width: 0 }, 0);
    let passoAtual = 0;
    /** marca o passo n (1…) como atual: barra da janela e progresso. opt.titulo: true → cartela do passo */
    K.passo = (n, t, opt = {}) => {
      if (!passos[n - 1]) throw new Error(`TUT.passo: não há passo ${n} em roteiro.json (passos)`);
      if (passoAtual) tl.to(indicadores[passoAtual - 1], { opacity: 0, y: -8, duration: 0.2 }, t);
      fromTo(indicadores[n - 1], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, t + 0.1);
      tl.to("#progresso i", { width: (n / passos.length) * JW, duration: 0.6, ease: "power2.inOut" }, t);
      passoAtual = n;
      if (opt.titulo !== false) K.cartelaPasso(n, t, opt.ate || t + 2.3);
      return t;
    };
    /** cartela do passo: a janela escurece um instante e o número + título do passo entram no meio dela.
     *  Use com a câmera no plano geral, antes da primeira ação do passo (T4). */
    K.cartelaPasso = (n, t0, t1) => {
      const p = passos[n - 1];
      const veu = mk("#ui", "k-veu", "");
      const e = mk("#ui", "k-cartela", `<span>PASSO ${n} DE ${passos.length}</span><b>${esc(p.titulo)}</b>${p.sub ? `<i>${esc(p.sub)}</i>` : ""}`);
      fromTo(veu, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, t0);
      fromTo(e, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, t0 + 0.05);
      tl.to(e, { opacity: 0, x: -20, duration: 0.3, ease: "power2.in" }, t1);
      tl.to(veu, { opacity: 0, duration: 0.35, ease: "power1.in" }, t1 + 0.05);
      K.sfx("carta", t0, 0.25);
      return e;
    };
    /** faixa de dica/atenção no alto da área da tela */
    K.aviso = (texto, t0, t1, opt = {}) => {
      const tipo = opt.tipo || "dica";
      const e = mk("#ui", "k-aviso k-" + tipo, `${icone(tipo)}<span>${esc(texto)}</span>`);
      fromTo(e, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, t0);
      tl.to(e, { opacity: 0, y: -8, duration: 0.25 }, t1);
      if (opt.sfx !== false) K.sfx(tipo === "atencao" ? "destaque" : "pop", t0, 0.3);
      return e;
    };
    /** confirmação de sucesso (toast do kit) — só quando o sistema não tem o próprio aviso desenhado na tela */
    K.sucesso = (texto, t0, t1) => {
      const e = mk("#ui", "k-sucesso", `${icone("check")}<span>${esc(texto)}</span>`);
      fromTo(e, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)" }, t0);
      tl.to(e, { opacity: 0, duration: 0.3 }, t1);
      K.sfx("sucesso", t0, 0.3);
      return e;
    };

    // ============================================================ CARTELAS DE TELA CHEIA
    const janela = $("#janela");
    const cartelaCheia = (cls, html, t0, t1, opt = {}) => {
      const e = mk("#cards", "k-cheia " + cls, html);
      set(e, { opacity: 0 }, 0);
      if (t0 <= 0.01) { set(e, { opacity: 1 }, 0); set(janela, { opacity: 0, scale: 0.96 }, 0); }
      else { fromTo(e, { opacity: 0 }, { opacity: 1, duration: 0.4 }, t0); tl.to(janela, { opacity: 0, scale: 0.96, duration: 0.4 }, t0); }
      tl.to(e, { opacity: 0, duration: 0.45, ease: "power2.in" }, t1);
      fromTo(janela, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }, t1 + 0.15);
      if (opt.sfx !== false) K.sfx("whoosh", t1, 0.2);
      return e;
    };
    /** abertura: produto, título do tutorial e a lista dos passos entrando um a um. opt.passosEm: tempos de cada item */
    K.abertura = (opt, t0, t1) => {
      const itens = (opt.passos === false ? [] : passos).map((p, i) => `<li><span>${i + 1}</span>${esc(p.titulo)}</li>`).join("");
      const e = cartelaCheia("k-abertura", `<div class="k-marca">${opt.logo ? `<img src="${opt.logo}" alt="">` : ""}${esc(opt.produto || C.produto || "")}</div>
        <h1>${esc(opt.titulo)}</h1>${opt.subtitulo ? `<p>${esc(opt.subtitulo)}</p>` : ""}<ol>${itens}</ol>`, t0, t1);
      fromTo(e.querySelector("h1"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, t0 + 0.15);
      const lis = [...e.querySelectorAll("li")];
      lis.forEach((li, i) => {
        const t = (opt.passosEm && opt.passosEm[i]) ?? t0 + 0.9 + i * 0.45;
        fromTo(li, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" }, t);
      });
      return e;
    };
    /** capítulo (para tutoriais com partes): cartela cheia com número e nome */
    K.capitulo = (n, titulo, t0, t1) => cartelaCheia("k-capitulo", `<span>PARTE ${n}</span><h2>${esc(titulo)}</h2>`, t0, t1);
    /** encerramento: o que a pessoa aprendeu, com os passos ticando. opt.marcasEm: tempo de cada tique */
    K.encerramento = (opt, t0, t1) => {
      const itens = (opt.itens || passos.map((p) => p.titulo)).map((s) => `<li><i>${icone("check")}</i>${esc(s)}</li>`).join("");
      const e = mk("#cards", "k-cheia k-encerramento", `<h2>${esc(opt.titulo || "Pronto!")}</h2><ul>${itens}</ul>${opt.rodape ? `<p>${esc(opt.rodape)}</p>` : ""}`);
      set(e, { opacity: 0 }, 0);
      fromTo(e, { opacity: 0 }, { opacity: 1, duration: 0.5 }, t0);
      tl.to(janela, { opacity: 0, scale: 0.96, duration: 0.45 }, t0);
      [...e.querySelectorAll("li")].forEach((li, i) => {
        const t = (opt.marcasEm && opt.marcasEm[i]) ?? t0 + 0.5 + i * 0.4;
        fromTo(li, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3 }, t);
        fromTo(li.querySelector("i"), { scale: 0 }, { scale: 1, duration: 0.3, ease: "back.out(2.5)" }, t + 0.15);
      });
      K.sfx("sucesso", t0 + 0.5, 0.25);
      if (t1) tl.to(e, { opacity: 0, duration: 0.4 }, t1);
      return e;
    };

    // ============================================================ LEGENDA (automática, pela narração)
    const legendas = [];
    if (C.legenda !== false && words.length) {
      const blocos = [];
      let atual = [];
      const fecha = () => { if (atual.length) blocos.push(atual); atual = []; };
      words.forEach((w, i) => {
        atual.push(w);
        const txt = atual.map((x) => x.text).join(" "), prox = words[i + 1];
        const pausa = prox ? prox.start - w.end : 9;
        if (/[.!?;:]$/.test(w.text) || (/,$/.test(w.text) && atual.length >= 4) || pausa > 0.32 || atual.length >= 8 || txt.length >= 44) fecha();
      });
      fecha();
      blocos.forEach((b, i) => {
        const ini = b[0].start, prox = blocos[i + 1];
        const fim = prox && prox[0].start - b[b.length - 1].end < 0.6 ? prox[0].start : b[b.length - 1].end + 0.3;
        const html = b.map((w) => `<span class="${w.label ? "k-rotulo" : ""}">${esc(w.text)}</span>`).join(" ");
        const e = mk("#cap", "k-leg", html);
        set(e, { opacity: 0 }, 0); set(e, { opacity: 1 }, ini); set(e, { opacity: 0 }, fim);
        legendas.push({ e, ini, fim });
      });
    }
    /** esconde a legenda num intervalo (cartelas cheias, por exemplo) */
    K.semLegenda = (t0, t1) => { tl.to("#cap", { opacity: 0, duration: 0.15 }, t0); tl.to("#cap", { opacity: 1, duration: 0.15 }, t1); };

    return K;
  }

  window.TUT = { init, W, H, JANELA: { x: JX, y: JY, w: JW, barra: BARRA, h: VH } };
})();
