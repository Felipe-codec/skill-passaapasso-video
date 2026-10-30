#!/usr/bin/env node
// Monta index.html do tutorial 16:9 (HyperFrames + GSAP) — mesma ideia do montar.mjs da reel: um template fixo do kit
// + o que muda de vídeo para vídeo (telas, narração, cenas).
// Rode na pasta do motor do projeto (<P>/motor):   node montar.mjs
// Lê:
//   tutorial.json            configuração (titulo, produto, zoom, telaLargura, sfx, sfxVol, legenda, cauda)
//   tema.json                cores e fontes do SISTEMA (opcional; sem ele vale a pele nativa da skill reel)
//   ../roteiro.json          passos (títulos) e segmentos da narração
//   telas/telas.json         [{id, arquivo, rota, largura?, css?}] + telas/*.html + telas/*.css + telas/arquivos/
//   assets/narracao.wav · assets/transcript.json · assets/segmentos.json   (ferramentas/narrar.py)
//   src/cenas.js             as cenas (uma chamada K.* por ação, ancorada na fala)
// Escreve index.html, meta.json, assets/tema.css e copia o kit (tut.js, tut.css, fontes, sfx, GSAP).
import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MOD = dirname(fileURLToPath(import.meta.url));
const KIT = join(MOD, "kit");
const ler = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d);
const falha = (m) => { console.error("ERRO: " + m); process.exit(1); };

mkdirSync("assets", { recursive: true });
mkdirSync("src", { recursive: true });
for (const f of ["tut.js", "tut.css"]) cpSync(join(KIT, f), join("assets", f));
cpSync(join(KIT, "fonts"), join("assets", "fonts"), { recursive: true });
cpSync(join(KIT, "sfx"), join("assets", "sfx"), { recursive: true });
const gsap = ["node_modules/gsap/dist/gsap.min.js", join(MOD, "node_modules/gsap/dist/gsap.min.js")].find(existsSync);
if (!gsap) falha("falta o GSAP: rode npm install nesta pasta (package.json do motor)");
cpSync(gsap, join("assets", "gsap.min.js"));
if (!existsSync("src/index.template.html")) cpSync(join(KIT, "index.template.html"), "src/index.template.html");
if (!existsSync("src/cenas.js")) cpSync(join(MOD, "cenas-modelo.js"), "src/cenas.js");
if (!existsSync("tutorial.json")) cpSync(join(MOD, "tutorial-padrao.json"), "tutorial.json");
if (!existsSync("hyperframes.json")) cpSync(join(MOD, "hyperframes.json"), "hyperframes.json");

const cfg = ler("tutorial.json", {});
for (const k of Object.keys(cfg)) if (k.startsWith("_")) delete cfg[k];
const roteiro = ler("../roteiro.json", null) || falha("falta ../roteiro.json (o roteiro do tutorial)");
const t = ler("assets/transcript.json", null) || falha("falta assets/transcript.json: rode ferramentas/narrar.py");
const segs = ler("assets/segmentos.json", []);
if (!existsSync("assets/narracao.wav")) falha("falta assets/narracao.wav: rode ferramentas/narrar.py");

const vozDur = +t.audio_duration_secs.toFixed(3);
const dur = +(cfg.dur || vozDur + (cfg.cauda ?? 1.5)).toFixed(3);
cfg.dur = dur;
cfg.passos = (roteiro.passos || []).map((p) => ({ titulo: p.titulo, sub: p.sub || "" }));
cfg.produto = cfg.produto || roteiro.produto || "";
const words = t.words.map((w) => Object.assign({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }, w.label ? { label: true } : {}));

// ---------------- tema (cores e fontes do sistema) ----------------
const tema = ler("tema.json", null);
let css = "";
if (tema) {
  const v = { "--k-bg": tema.fundo, "--k-bg2": tema.fundoProfundo, "--k-sup": tema.superficie, "--k-txt": tema.texto,
    "--k-acc": tema.destaque, "--k-apoio": tema.apoio, "--k-mudo": tema.mudo };
  const fontes = tema.fontes || [];
  for (const f of fontes) {
    if (!f.arquivo || !existsSync(f.arquivo)) falha(`tema.json: fonte sem arquivo local: ${f.familia} (${f.arquivo})`);
    const destino = join("assets", "fontes-tema", f.arquivo.split("/").pop());
    mkdirSync(dirname(destino), { recursive: true }); cpSync(f.arquivo, destino);
    css += `@font-face{font-family:"${f.familia}";src:url("fontes-tema/${f.arquivo.split("/").pop()}");font-weight:${f.peso || "100 900"};font-style:${f.estilo || "normal"};}\n`;
  }
  if (tema.fonteTitulo) v["--k-fT"] = `"${tema.fonteTitulo}", sans-serif`;
  if (tema.fonteTexto) v["--k-fS"] = `"${tema.fonteTexto}", sans-serif`;
  css += "#tut{" + Object.entries(v).filter(([, x]) => x).map(([k, x]) => `${k}:${x};`).join("") + "}\n";
}
writeFileSync("assets/tema.css", "/* gerado por montar.mjs a partir de tema.json — não edite */\n" + css);

// ---------------- telas ----------------
const lista = ler("telas/telas.json", null) || falha("falta telas/telas.json (lista das telas do sistema)");
if (existsSync("telas/arquivos")) cpSync("telas/arquivos", "assets/telas/arquivos", { recursive: true });
const caminhos = (s) => s.replace(/(src|href)="arquivos\//g, '$1="assets/telas/arquivos/').replace(/url\((['"]?)arquivos\//g, "url($1assets/telas/arquivos/");
const cssTelas = new Set();
let telasHtml = "";
for (const tela of lista) {
  if (!existsSync(join("telas", tela.arquivo))) falha(`telas.json: arquivo não existe: telas/${tela.arquivo}`);
  const larg = tela.largura || cfg.telaLargura || 1440, esc = +(1520 / larg).toFixed(5);
  const html = caminhos(readFileSync(join("telas", tela.arquivo), "utf8")).replace(/<script[\s\S]*?<\/script>/gi, "");
  for (const c of [].concat(tela.css || [])) cssTelas.add(c);
  telasHtml += `<section class="tela" id="tela-${tela.id}" data-rota="${(tela.rota || "").replace(/"/g, "&quot;")}">` +
    `<div class="escala" data-escala="${esc}" style="width:${larg}px;transform:scale(${esc})"><div class="rolagem">\n${html}\n</div></div></section>\n`;
}
let cssLinks = "";
mkdirSync("assets/telas", { recursive: true });
for (const c of cssTelas) {
  if (!existsSync(join("telas", c))) falha(`telas.json: css não existe: telas/${c}`);
  cpSync(join("telas", c), join("assets/telas", c));   // url(arquivos/…) continua valendo: o css fica ao lado de assets/telas/arquivos/
  cssLinks += `<link rel="stylesheet" href="assets/telas/${c}">\n`;
}

// ---------------- index.html ----------------
const cenas = readFileSync("src/cenas.js", "utf8");
const html = readFileSync("src/index.template.html", "utf8")
  .replace("__TITULO__", (cfg.titulo || "Tutorial").replace(/</g, ""))
  .replace("__CSS__", cssLinks + '<link rel="stylesheet" href="assets/tema.css">')
  .replaceAll("__DUR__", String(dur)).replace("__VOZ_INICIO__", "0").replace("__VOZ_DUR__", String(vozDur))
  .replace("__TELAS__", telasHtml).replace("__CFG__", JSON.stringify(cfg)).replace("__WORDS__", JSON.stringify(words))
  .replace("__SEGS__", JSON.stringify(segs)).replace("__CENAS__", cenas);
writeFileSync("index.html", html);
const meta = ler("meta.json", {});
Object.assign(meta, { id: "tutorial", width: 1920, height: 1080, fps: 30 });
writeFileSync("meta.json", JSON.stringify(meta, null, 2));
const min = Math.floor(dur / 60), seg = (dur % 60).toFixed(1);
console.log(`index.html ok — ${min}min${seg}s · ${words.length} palavras · ${segs.length} segmentos · ${lista.length} telas · ${cfg.passos.length} passos · tema: ${tema ? "do sistema" : "nativo (pele da reel)"}`);
