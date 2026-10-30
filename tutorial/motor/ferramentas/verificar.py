#!/usr/bin/env python3
"""Verificação do tutorial antes de entregar → <projeto>/VERIFY.md (cada item aprovado ou reprovado com o porquê).

Uso (na pasta do motor):  python3 ferramentas/verificar.py .. --video render/tutorial-v1.mp4
Confere: formato 1920×1080 a 30 qps · duração (alvo 2–5 min) · áudio −14 LUFS ±0,5 e pico ≤ −0,5 dBTP · narração de
verdade (não o rascunho) · todo rótulo «…» do roteiro existe numa tela · todo passo tem K.passo nas cenas · nenhum dado
sensível nas telas nem no roteiro (e-mail, CPF, chave de API, endereço interno) · capítulos válidos · folha de quadros.
"""
import argparse, json, os, re, subprocess, sys, unicodedata

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9%$ ]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn"))).strip()

def probe(v):
    j = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", v], capture_output=True, text=True).stdout)
    vs = next(s for s in j["streams"] if s["codec_type"] == "video"); n, d = vs["r_frame_rate"].split("/")
    return vs["width"], vs["height"], float(n) / float(d), float(j["format"]["duration"]), any(s["codec_type"] == "audio" for s in j["streams"])

def loud(v):
    e = subprocess.run(["ffmpeg", "-nostats", "-i", v, "-af", "loudnorm=I=-14:TP=-1:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    j = json.loads(e[e.rindex("{"):e.rindex("}") + 1]); return float(j["input_i"]), float(j["input_tp"])

SENSIVEL = [
    (r"[\w.+-]+@[\w-]+\.[\w.]+", "e-mail"),
    (r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b", "CPF"),
    (r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b", "CNPJ"),
    (r"\b(sk-[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[bp]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,})", "chave/token"),
    (r"\b(10|172\.(1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b", "IP interno"),
    (r"\b[\w-]+\.(internal|corp|lan|intranet)\b", "endereço interno"),
]
FICTICIOS = re.compile(r"@(exemplo|example|teste|test)\.|@empresa\.ficticia", re.I)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("projeto"); ap.add_argument("--video", required=True)
    a = ap.parse_args(); P = a.projeto; M = os.getcwd()
    itens = []
    ok = lambda nome, passou, det: itens.append((nome, passou, det))
    V = os.path.join(P, a.video)
    if not os.path.exists(V): sys.exit(f"vídeo não existe: {V}")
    w, h, fps, dur, tem_audio = probe(V)
    ok("Formato", (w, h) == (1920, 1080) and abs(fps - 30) < 0.1, f"{w}×{h} a {fps:.2f} qps")
    ok("Duração (alvo 2–5 min)", 100 <= dur <= 330, f"{int(dur // 60)}min{dur % 60:04.1f}s")
    if tem_audio:
        i, tp = loud(V); ok("Áudio −14 LUFS ±0,5 · pico ≤ −0,5 dBTP", abs(i + 14) <= 0.5 and tp <= -0.5, f"{i:.1f} LUFS · {tp:.1f} dBTP")
    else: ok("Áudio", False, "o vídeo não tem áudio")
    rel = os.path.join(M, "assets", "narracao", "relatorio.txt")
    modo = open(rel, encoding="utf-8").readline().strip() if os.path.exists(rel) else "?"
    ok("Narração de verdade", "rascunho" not in modo, modo)

    R = json.load(open(os.path.join(P, "roteiro.json"), encoding="utf-8"))
    telas_txt = ""
    lista = json.load(open(os.path.join(M, "telas", "telas.json"), encoding="utf-8"))
    for t in lista:
        html = open(os.path.join(M, "telas", t["arquivo"]), encoding="utf-8").read()
        telas_txt += " " + re.sub(r"<[^>]+>", " ", html) + " " + " ".join(re.findall(r'(?:value|placeholder|aria-label|title)="([^"]*)"', html))
    telas_n = norm(telas_txt)
    rotulos = sorted({r for s in R["segmentos"] for r in re.findall(r"«([^»]+)»", s["texto"])})
    faltam = [r for r in rotulos if norm(r) not in telas_n]
    ok("Rótulos falados existem nas telas", not faltam, f"{len(rotulos)} rótulos" + (f"; faltam: {', '.join(faltam)}" if faltam else ""))

    cenas = open(os.path.join(M, "src", "cenas.js"), encoding="utf-8").read()
    feitos = {int(n) for n in re.findall(r"K\.passo\(\s*(\d+)", cenas)}
    sem = [i + 1 for i in range(len(R.get("passos", []))) if i + 1 not in feitos]
    ok("Todo passo marcado nas cenas (K.passo)", not sem, f"{len(feitos)} de {len(R.get('passos', []))}" + (f"; sem marca: {sem}" if sem else ""))

    achados = []
    textos = [("roteiro.json", json.dumps(R, ensure_ascii=False))] + [(f"telas/{t['arquivo']}", open(os.path.join(M, "telas", t["arquivo"]), encoding="utf-8").read()) for t in lista]
    for nome, txt in textos:
        for rx, tipo in SENSIVEL:
            for m in re.finditer(rx, txt):
                if tipo == "e-mail" and (FICTICIOS.search(m.group(0)) or re.search(r"\.(png|jpe?g|svg|webp|gif|css|js)$", m.group(0))): continue
                achados.append(f"{nome}: {tipo} «{m.group(0)[:40]}»")
    ok("Nenhum dado sensível nas telas/roteiro", not achados, "nada encontrado" if not achados else "; ".join(achados[:6]) + (" …" if len(achados) > 6 else ""))

    cap = os.path.join(P, "entrega", "capitulos.txt")
    if os.path.exists(cap):
        linhas = [l for l in open(cap, encoding="utf-8").read().splitlines() if l.strip()]
        ok("Capítulos (YouTube)", len(linhas) >= 3 and linhas[0].startswith("00:00"), f"{len(linhas)} capítulos")
    else: ok("Capítulos (YouTube)", False, "falta entrega/capitulos.txt (ferramentas/capitulos.py)")
    ok("Folha de quadros", os.path.exists(os.path.join(P, "qa", "folha-final.png")), "qa/folha-final.png")
    ok("Capa", os.path.exists(os.path.join(P, "entrega", "capa.jpg")), "entrega/capa.jpg (ferramentas/capa.sh)")

    aprov = all(p for _, p, _ in itens)
    md = [f"# VERIFY — {os.path.basename(a.video)}", "", f"**{'APROVADO' if aprov else 'REPROVADO'}** · {sum(p for _, p, _ in itens)}/{len(itens)} itens", "",
          "| Item | | Detalhe |", "|---|---|---|"] + [f"| {n} | {'✅' if p else '❌'} | {d} |" for n, p, d in itens] + ["",
          "Conferência visual (faça olhando a folha e os snapshots): texto legível em todo quadro · cursor e clique no alvo certo ·",
          "zoom não corta o que a voz descreve · nenhuma cartela sobre a ação · legenda não cobre o que está sendo clicado.", ""]
    open(os.path.join(P, "VERIFY.md"), "w", encoding="utf-8").write("\n".join(md))
    print("\n".join(md))
    sys.exit(0 if aprov else 1)

if __name__ == "__main__":
    main()
