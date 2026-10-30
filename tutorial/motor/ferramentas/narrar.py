#!/usr/bin/env python3
"""Narração do tutorial: roteiro.json → assets/narracao.wav + transcript.json + segmentos.json.

Três modos (a composição não muda entre eles: as cenas ancoram na fala com K.at / K.seg):
  voz sintética (padrão)   um arquivo de voz por segmento do roteiro, com cache (só refaz o que mudou)
  --gravacao <wav/mp4>     a SUA voz lendo o roteiro, já limpa pelo motor de corte da skill reel
                           (clean.mp4 + cortepalavras.json/palavras.json com os tempos de cada palavra)
  --rascunho               sem voz: silêncio com a duração estimada (≈150 palavras/min) para montar e revisar as
                           cenas antes de gerar a voz; troque pela voz de verdade antes do render final

Uso (na pasta do motor):
  python3 ferramentas/narrar.py ../roteiro.json                      # voz sintética
  python3 ferramentas/narrar.py ../roteiro.json --rascunho
  python3 ferramentas/narrar.py ../roteiro.json --gravacao ../corte/clean.mp4 --palavras ../corte/cortepalavras.json

Voz sintética: o comando vem de TUTORIAL_TTS (modelo com {texto} {voz} {saida}); o padrão é o Kokoro do HyperFrames:
  npx hyperframes tts {texto} --voice {voz} --output {saida}
Vozes em português do Brasil do Kokoro: pf_dora (feminina), pm_alex e pm_santa (masculinas) — confira com
`npx hyperframes tts --list`. Para outra voz/serviço, defina TUTORIAL_TTS com o comando que escreve um wav em {saida}.

No roteiro, marque os rótulos da interface entre «» («Novo cliente», «Salvar»): a voz lê sem as aspas, a legenda pinta
o rótulo com a cor de apoio e o verificar.py confere que cada rótulo existe numa tela.
Palavras com tempo: se houver whisper-cli + modelo (WHISPER_MODEL), os tempos vêm da transcrição de cada segmento;
senão, são distribuídos pelas sílabas dentro do segmento (bom para voz sintética, que tem ritmo regular).
"""
import argparse, hashlib, json, os, re, shlex, shutil, subprocess, sys, tempfile, unicodedata

TTS_PADRAO = "npx hyperframes tts {texto} --voice {voz} --output {saida}"

def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode: sys.exit(f"falhou: {' '.join(cmd[:4])}…\n{r.stderr[-1500:]}")
    return r.stdout

def duracao(f):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).strip())

def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9%$ ]+", " ", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip()

def tokens(texto):
    """palavras do texto com a marca de rótulo («…») por palavra."""
    out, dentro = [], False
    for parte in re.split(r"(«|»)", texto):
        if parte == "«": dentro = True; continue
        if parte == "»": dentro = False; continue
        for w in parte.split():
            if out and not re.search(r"\w", w): out[-1]["text"] += w   # «Salvar». → "Salvar." (pontuação fica na palavra)
            else: out.append({"text": w, "label": dentro})
    return [t for t in out if t["text"]]

def silabas(w):
    return max(1, len(re.findall(r"[aeiouáéíóúâêôãõày]+", w.lower())))

def peso(w):
    p = silabas(w) + 0.4
    if re.search(r"[.!?:;]$", w): p += 2.2
    elif w.endswith(","): p += 1.0
    return p

def limpar(entrada, saida):
    """48 kHz estéreo, sem silêncio nas pontas."""
    filtro = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,"
              "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse")
    sh(["ffmpeg", "-v", "error", "-y", "-i", entrada, "-af", filtro, "-ar", "48000", "-ac", "2", saida])

def silencio(seg, saida):
    sh(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", f"{max(seg, 0.01):.3f}", saida])

def whisper_palavras(wav):
    w = shutil.which("whisper-cli") or shutil.which("whisper-cpp")
    m = os.environ.get("WHISPER_MODEL") or os.path.expanduser("~/.cache/whisper-cpp/ggml-large-v3-turbo.bin")
    if not w or not os.path.exists(m): return None
    with tempfile.TemporaryDirectory() as d:
        a16 = os.path.join(d, "a.wav"); sh(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", "16000", a16])
        base = os.path.join(d, "w"); subprocess.run([w, "-m", m, "-f", a16, "-l", "pt", "-ojf", "-ml", "1", "-sow", "-of", base, "-np"], capture_output=True)
        if not os.path.exists(base + ".json"): return None
        j = json.load(open(base + ".json", encoding="utf-8"))
    return [(s["offsets"]["from"] / 1000, s["offsets"]["to"] / 1000, s["text"].strip()) for s in j["transcription"] if s["text"].strip()]

def tempos_estimados(toks, dur):
    pesos = [peso(t["text"]) for t in toks]; total = sum(pesos) or 1; t = 0.0; out = []
    for tk, p in zip(toks, pesos):
        fala = (silabas(tk["text"]) + 0.4) / p          # a parte do peso que é fala (o resto é a pausa da pontuação)
        d = dur * p / total
        out.append({"text": tk["text"], "start": round(t, 3), "end": round(t + d * fala, 3), **({"label": True} if tk["label"] else {})})
        t += d
    return out

def tempos_whisper(toks, wav, dur):
    ws = whisper_palavras(wav)
    if not ws or len(ws) != len(toks): return None   # só usa quando casa palavra a palavra; senão, estimativa
    return [{"text": tk["text"], "start": round(a, 3), "end": round(min(b, dur), 3), **({"label": True} if tk["label"] else {})}
            for tk, (a, b, _) in zip(toks, ws)]

def gerar_tts(texto, voz, saida):
    modelo = os.environ.get("TUTORIAL_TTS", TTS_PADRAO)
    cmd = [p.replace("{texto}", texto).replace("{voz}", voz).replace("{saida}", saida) for p in shlex.split(modelo)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode or not os.path.exists(saida):
        sys.exit(f"a voz sintética falhou ({cmd[0]} …). Confira `npx hyperframes tts --list` ou defina TUTORIAL_TTS.\n{r.stderr[-1200:]}")

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("roteiro"); ap.add_argument("--pasta", default="assets")
    ap.add_argument("--rascunho", action="store_true"); ap.add_argument("--voz")
    ap.add_argument("--gravacao"); ap.add_argument("--palavras")
    a = ap.parse_args()
    R = json.load(open(a.roteiro, encoding="utf-8"))
    segs = R["segmentos"]; voz = a.voz or R.get("voz", "pf_dora")
    P = {"inicio": 0.5, "entreFrases": 0.35, "entrePassos": 0.85, **R.get("pausas", {})}
    os.makedirs(os.path.join(a.pasta, "narracao", "segs"), exist_ok=True)
    ids = [s["id"] for s in segs]
    if len(set(ids)) != len(ids): sys.exit("roteiro.json: ids de segmento repetidos")

    if a.gravacao:
        return da_gravacao(a, R, segs)

    partes, words, out_segs, t = [], [], [], P["inicio"]
    tmp = tempfile.mkdtemp()
    sil0 = os.path.join(tmp, "s0.wav"); silencio(P["inicio"], sil0); partes.append(sil0)
    for i, s in enumerate(segs):
        toks = tokens(s["texto"]); fala = " ".join(tk["text"] for tk in toks)
        if a.rascunho:
            dur = sum(peso(tk["text"]) for tk in toks) * 0.165
            wav = os.path.join(tmp, f"r{i}.wav"); silencio(dur, wav)
        else:
            h = hashlib.sha1(f"{voz}|{fala}|{os.environ.get('TUTORIAL_TTS', '')}".encode()).hexdigest()[:10]
            wav = os.path.join(a.pasta, "narracao", "segs", f"{s['id']}-{h}.wav")
            if not os.path.exists(wav):
                bruto = os.path.join(tmp, f"b{i}.wav"); gerar_tts(fala, voz, bruto); limpar(bruto, wav)
                print(f"  voz: {s['id']} ({duracao(wav):.2f}s)")
            dur = duracao(wav)
        ws = (None if a.rascunho else tempos_whisper(toks, wav, dur)) or tempos_estimados(toks, dur)
        for w in ws: words.append({**w, "start": round(w["start"] + t, 3), "end": round(w["end"] + t, 3)})
        out_segs.append({"id": s["id"], "passo": s.get("passo", 0), "texto": s["texto"], "start": round(t, 3), "end": round(t + dur, 3)})
        partes.append(wav); t += dur
        if i < len(segs) - 1:
            pausa = s.get("pausaDepois", P["entrePassos"] if segs[i + 1].get("passo") != s.get("passo") else P["entreFrases"])
            sp = os.path.join(tmp, f"p{i}.wav"); silencio(pausa, sp); partes.append(sp); t += pausa
    lista = os.path.join(tmp, "lista.txt")
    open(lista, "w").write("".join(f"file '{os.path.abspath(p)}'\n" for p in partes))
    saida = os.path.join(a.pasta, "narracao.wav")
    sh(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", saida])
    escrever(a, R, words, out_segs, duracao(saida), "rascunho (silêncio)" if a.rascunho else f"voz sintética ({voz})")

def da_gravacao(a, R, segs):
    if not a.palavras: sys.exit("--gravacao precisa de --palavras (cortepalavras.json do motor de corte ou palavras.json do preparar.py)")
    saida = os.path.join(a.pasta, "narracao.wav")
    sh(["ffmpeg", "-v", "error", "-y", "-i", a.gravacao, "-vn", "-ar", "48000", "-ac", "2", saida])
    bruto = json.load(open(a.palavras, encoding="utf-8"))
    rec = []
    for p in bruto:
        if isinstance(p, dict): rec.append((p.get("i", p.get("start")), p.get("f", p.get("end")), str(p.get("t", p.get("text", ""))).strip()))
        else: rec.append((p[0], p[1], str(p[2]).strip()))
    rec = [r for r in rec if r[2]]
    # alinha cada segmento do roteiro na gravação, em ordem (a pessoa pode ter mudado uma palavra ou outra)
    words, out_segs, k = [], [], 0
    for s in segs:
        toks = tokens(s["texto"]); alvo = [norm(t["text"]).replace(" ", "") for t in toks]
        rotulos = {norm(t["text"]).replace(" ", "") for t in toks if t["label"]}
        ini = None
        for j in range(k, len(rec)):
            if norm(rec[j][2]).replace(" ", "") in alvo[:3]: ini = j; break
        if ini is None: sys.exit(f"segmento {s['id']}: não achei o começo na gravação ({' '.join(alvo[:3])}). Regrave ou ajuste o roteiro ao que foi dito.")
        fim = min(len(rec), ini + len(alvo)) - 1
        for j in range(ini, fim + 1):
            a0, b0, tx = rec[j]
            words.append({"text": tx, "start": round(a0, 3), "end": round(b0, 3), **({"label": True} if norm(tx).replace(" ", "") in rotulos else {})})
        out_segs.append({"id": s["id"], "passo": s.get("passo", 0), "texto": s["texto"], "start": round(rec[ini][0], 3), "end": round(rec[fim][1], 3)})
        k = fim + 1
    escrever(a, R, words, out_segs, duracao(saida), "sua voz (gravação limpa)")

def escrever(a, R, words, segs, dur, modo):
    json.dump({"language_code": "pt", "audio_duration_secs": round(dur, 3), "text": " ".join(w["text"] for w in words), "words": words},
              open(os.path.join(a.pasta, "transcript.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    json.dump(segs, open(os.path.join(a.pasta, "segmentos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    blocos = []                                    # trechos contíguos do mesmo passo (abertura e encerramento separados)
    for s in segs:
        if blocos and blocos[-1][0] == s["passo"]: blocos[-1][2] = s["end"]
        else: blocos.append([s["passo"], s["start"], s["end"]])
    linhas = [f"modo: {modo}", f"duração: {int(dur // 60)}min{dur % 60:04.1f}s · {len(words)} palavras · {len(words) / (dur / 60):.0f} palavras/min"]
    nomes = {i + 1: p["titulo"] for i, p in enumerate(R.get("passos", []))}
    for k, (n, i0, i1) in enumerate(blocos):
        nome = f"passo {n}: {nomes.get(n, '?')}" if n else ("abertura" if k == 0 else "encerramento")
        linhas.append(f"  {nome}: {i0:6.1f}s → {i1:6.1f}s ({i1 - i0:.1f}s)")
    if dur < 100: linhas.append("AVISO: menos de 2 min — o alvo é 2 a 5 min; veja se faltam passos ou explicação.")
    if dur > 330: linhas.append("AVISO: mais de 5 min — corte explicação ou divida em dois tutoriais.")
    open(os.path.join(a.pasta, "narracao", "relatorio.txt"), "w", encoding="utf-8").write("\n".join(linhas) + "\n")
    print("\n".join(linhas))

if __name__ == "__main__":
    main()
