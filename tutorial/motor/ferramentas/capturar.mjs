#!/usr/bin/env node
// Captura telas REAIS do sistema rodando na máquina (servidor de desenvolvimento, com dados fictícios) e as transforma
// em telas estáticas do tutorial: o HTML da página sem scripts, o CSS do sistema escopado para não vazar no vídeo e os
// arquivos (imagens, fontes) baixados para telas/arquivos/. É o "mostre a coisa de verdade" do /brag: reaproveitar a
// interface real em vez de redesenhar. Quando o sistema não roda localmente, as telas são recriadas à mão a partir do
// código (referencias/3-telas.md).
//
// Uso (na pasta do motor):  node ferramentas/capturar.mjs telas/capturar.json
// telas/capturar.json:
//   { "base": "http://localhost:5173", "largura": 1440,
//     "telas": [ { "id": "lista", "rota": "/clientes", "esperar": "table",
//                  "acoes": [ {"clicar": "text=Novo cliente"}, {"preencher": ["#nome", "Maria Souza"]}, {"esperar": ".modal"} ] } ] }
// Só aceita servidor local (localhost, 127.0.0.1, *.localhost, *.test): o que é capturado vira vídeo público, então
// a base de dados precisa ser de teste. Outro host só com "permitirHost": true no capturar.json, decidido pela pessoa.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const plano = JSON.parse(readFileSync(process.argv[2] || "telas/capturar.json", "utf8"));
const base = new URL(plano.base);
const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname) || /\.(localhost|test)$/.test(base.hostname);
if (!local && plano.permitirHost !== true) {
  console.error(`ERRO: ${base.hostname} não é um servidor local. Rode o sistema na sua máquina com dados de teste.`);
  process.exit(1);
}
const LARG = plano.largura || 1440, ALT = Math.round(808 * LARG / 1520);
mkdirSync("telas/arquivos", { recursive: true }); mkdirSync("telas/ref", { recursive: true });
const listaPath = "telas/telas.json";
const lista = existsSync(listaPath) ? JSON.parse(readFileSync(listaPath, "utf8")) : [];
const regrasCss = new Map(existsSync("telas/sistema.css.json") ? JSON.parse(readFileSync("telas/sistema.css.json", "utf8")) : []);

const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: LARG, height: ALT }, deviceScaleFactor: 1 });
const baixados = new Map();
const baixar = async (url) => {
  if (baixados.has(url)) return baixados.get(url);
  let nome = null;
  try {
    const r = await page.request.get(url);
    if (r.ok()) {
      const ext = (extname(new URL(url).pathname) || ".bin").slice(0, 8);
      nome = createHash("sha1").update(url).digest("hex").slice(0, 12) + ext;
      writeFileSync(join("telas/arquivos", nome), await r.body());
    }
  } catch { /* fica sem o arquivo */ }
  baixados.set(url, nome);
  return nome;
};

for (const t of plano.telas) {
  await page.goto(new URL(t.rota || "/", base).href, { waitUntil: "networkidle" });
  if (t.esperar) await page.waitForSelector(t.esperar, { timeout: 15000 });
  for (const a of t.acoes || []) {
    if (a.clicar) await page.click(a.clicar);
    if (a.preencher) await page.fill(a.preencher[0], a.preencher[1]);
    if (a.selecionar) await page.selectOption(a.selecionar[0], a.selecionar[1]);
    if (a.esperar) await page.waitForSelector(a.esperar, { timeout: 15000 });
    if (a.pausa) await page.waitForTimeout(a.pausa);
  }
  await page.waitForTimeout(t.pausa ?? 400);
  await page.screenshot({ path: `telas/ref/${t.id}.png` });   // a tela real, para comparar com a recriada

  const r = await page.evaluate(({ alvo }) => {
    const abs = (u) => { try { return new URL(u, document.baseURI).href; } catch { return u; } };
    const raiz = alvo ? document.querySelector(alvo) : document.body;
    // valores digitados viram atributo (o HTML estático guarda o estado); senhas nunca
    raiz.querySelectorAll("input, textarea, select").forEach((e) => {
      if (e.type === "password") { e.setAttribute("value", ""); return; }
      if (e.tagName === "TEXTAREA") e.textContent = e.value;
      else if (e.tagName === "SELECT") [...e.options].forEach((o) => o.toggleAttribute("selected", o.selected));
      else if (e.type === "checkbox" || e.type === "radio") e.toggleAttribute("checked", e.checked);
      else e.setAttribute("value", e.value);
    });
    const copia = raiz.cloneNode(true);
    copia.querySelectorAll("script, noscript, iframe, object, embed, link[rel=preload], link[rel=modulepreload]").forEach((e) => e.remove());
    const urls = new Set();
    copia.querySelectorAll("canvas").forEach((c, i) => {
      const orig = raiz.querySelectorAll("canvas")[i];
      try { const img = document.createElement("img"); img.src = orig.toDataURL(); img.style.cssText = orig.style.cssText; img.width = orig.width; img.height = orig.height; c.replaceWith(img); } catch { }
    });
    copia.querySelectorAll("[src]").forEach((e) => { const u = abs(e.getAttribute("src")); if (!u.startsWith("data:")) { urls.add(u); e.setAttribute("src", "§" + u + "§"); } });
    copia.querySelectorAll("[srcset]").forEach((e) => e.removeAttribute("srcset"));
    copia.querySelectorAll("[style*='url(']").forEach((e) => e.setAttribute("style", e.getAttribute("style").replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => { u = abs(u); urls.add(u); return `url(§${u}§)`; })));
    // CSS de todas as folhas, escopado: html/:root → .k-html, body → .k-body, tudo sob #telas
    const escopo = (sel) => sel.split(",").map((s) => {
      s = s.trim().replace(/^(html|:root)(?=[\s.:\[#>~+]|$)/, ".k-html").replace(/(^|[\s>~+])body(?=[\s.:\[#>~+]|$)/g, "$1.k-body");
      return "#telas " + s;
    }).join(", ");
    const regras = [];
    const anda = (lista, abre = "", fecha = "") => {
      for (const r of lista) {
        if (r.type === 1) regras.push(abre + escopo(r.selectorText) + "{" + r.style.cssText + "}" + fecha);
        else if (r.type === 4) anda(r.cssRules, abre + "@media " + r.conditionText + "{", fecha + "}");
        else if (r.type === 12) anda(r.cssRules, abre + "@supports " + r.conditionText + "{", fecha + "}");
        else if (r.cssText) regras.push(abre + r.cssText + fecha);   // @font-face, @keyframes, @property…
      }
    };
    let bloqueadas = 0;
    for (const f of document.styleSheets) { try { anda(f.cssRules); } catch { bloqueadas++; } }
    const css = regras.map((c) => c.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => { if (u.startsWith("data:")) return m; u = abs(u); urls.add(u); return `url(§${u}§)`; }));
    const H = document.documentElement, B = document.body;
    const attrs = (el) => [...el.attributes].filter((a) => a.name !== "class" && a.name !== "style").map((a) => `${a.name}="${a.value.replace(/"/g, "&quot;")}"`).join(" ");
    const html = `<div class="k-html ${H.className}" ${attrs(H)}><div class="k-body ${B.className}" ${attrs(B)}>${alvo ? copia.outerHTML : copia.innerHTML}</div></div>`;
    return { html, css, urls: [...urls], bloqueadas };
  }, { alvo: t.seletor || null });

  const troca = new Map();
  for (const u of r.urls) troca.set(u, await baixar(u));
  const fix = (s) => s.replace(/§([^§]+)§/g, (m, u) => (troca.get(u) ? `arquivos/${troca.get(u)}` : u));
  writeFileSync(`telas/${t.id}.html`, `<!-- capturada de ${t.rota} — não contém scripts -->\n<style>#tela-${t.id} .k-html{min-height:${ALT}px}</style>\n` + fix(r.html));
  // vh/vw do sistema valem para a janela do vídeo (1440 × 765 por padrão), não para a página 1920 × 1080 da composição
  const unidades = (s) => s.replace(/(-?\d*\.?\d+)(d|s|l)?v(h|w)\b/g, (m, n, _, eixo) => `${+(n * (eixo === "h" ? ALT : LARG) / 100).toFixed(2)}px`);
  for (const c of r.css) { const k = unidades(fix(c)); regrasCss.set(k, true); }
  const item = { id: t.id, arquivo: `${t.id}.html`, rota: t.rotaExibida || t.rota || "/", largura: LARG, css: ["sistema.css"], capturada: true };
  const i = lista.findIndex((x) => x.id === t.id);
  if (i >= 0) lista[i] = Object.assign(lista[i], item); else lista.push(item);
  console.log(`tela ${t.id}: ${t.rota} · ${r.urls.length} arquivos · ${r.css.length} regras css${r.bloqueadas ? ` · ${r.bloqueadas} folhas de outro domínio ignoradas` : ""}`);
}
await browser.close();
writeFileSync("telas/sistema.css", "/* CSS do sistema capturado por ferramentas/capturar.mjs, escopado em #telas */\n" + [...regrasCss.keys()].join("\n"));
writeFileSync("telas/sistema.css.json", JSON.stringify([...regrasCss.entries()]));
writeFileSync(listaPath, JSON.stringify(lista, null, 2));
const falhos = [...baixados.entries()].filter(([, n]) => !n).map(([u]) => u);
if (falhos.length) console.log(`AVISO: ${falhos.length} arquivos não baixaram (ficam com o endereço original e não aparecem no render):\n  ` + falhos.slice(0, 8).join("\n  "));
console.log(`telas/telas.json: ${lista.length} telas · referência real em telas/ref/ · revise o rótulo de rota exibido (rotaExibida) e se há dado pessoal na tela`);
