#!/usr/bin/env python3
"""Capítulos para a descrição do YouTube (e para a MINUTAGEM): um por passo, a partir dos tempos reais da narração.
Uso (na pasta do motor):  python3 ferramentas/capitulos.py ../roteiro.json assets/segmentos.json > ../entrega/capitulos.txt
Regras do YouTube: o primeiro em 00:00, pelo menos 3 capítulos, cada um com 10 s ou mais (os curtos se juntam ao anterior)."""
import json, sys
R = json.load(open(sys.argv[1], encoding="utf-8")); S = json.load(open(sys.argv[2], encoding="utf-8"))
nomes = {i + 1: p["titulo"] for i, p in enumerate(R.get("passos", []))}
cap = [[0.0, R.get("aberturaTitulo", "Introdução")]]
vistos = set()
for s in S:
    n = s.get("passo", 0)
    if n and n not in vistos:
        vistos.add(n); cap.append([s["start"], f"Passo {n} — {nomes.get(n, '')}".rstrip(" —")])
fim = [s for s in S if s.get("passo", 0) == 0 and s["start"] > (cap[-1][0] if len(cap) > 1 else 0)]
if fim: cap.append([fim[0]["start"], R.get("encerramentoTitulo", "Resumo")])
limpo = []
for t, nome in cap:
    if limpo and t - limpo[-1][0] < 10: continue
    limpo.append([t, nome])
fmt = lambda t: f"{int(t // 60):02d}:{int(t % 60):02d}"
for t, nome in limpo: print(f"{fmt(t)} {nome}")
if len(limpo) < 3: print("AVISO: menos de 3 capítulos — o YouTube não mostra capítulos assim", file=sys.stderr)
