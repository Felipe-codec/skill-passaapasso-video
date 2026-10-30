# 6 · Render, áudio e entrega

Tudo na pasta `motor/` do projeto, com a narração de verdade já gerada (não o rascunho).

## 1. Conferir antes do render
```bash
node montar.mjs && npx hyperframes lint                     # 0 erros
npx hyperframes snapshot --at <tempos> -o ../qa/snapshots    # cada passo, clique, zoom, troca de tela, abertura, encerramento
```
Olhe cada snapshot (T4, T9): o cursor está no alvo, o zoom mostra o que a voz descreve, nenhum balão ou cartela
cobre a ação, nada cortado, a legenda não cobre o clique. Tela em branco ou sem a interface = erro no console
(âncora ou seletor): `npx hyperframes preview` e leia o console.

## 2. Render
```bash
npx hyperframes render -q high -o ../render/_bruto.mp4      # 1920×1080, 30 qps, narração + efeitos
```
Um tutorial de 3 minutos tem 5.400 quadros: rode em segundo plano e avise a pessoa. Para iterar, `-q draft`.

## 3. Áudio final (T7, T8)
```bash
bash ferramentas/audio-final.sh ../render/_bruto.mp4 ../render/tutorial-v1.mp4 "$S/assets/musica/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3"
bash ferramentas/audio-final.sh ../render/_bruto.mp4 ../render/tutorial-v1.mp4 nenhuma      # sem trilha
```
A trilha entra em loop a −21 dB (4º argumento muda), com entrada e saída suaves, e abaixa sozinha quando a voz
fala. Depois vem o loudness: −14 LUFS ±0,3 e pico ≤ −1 dBTP, com a calibração da reel. Trilhas: `vol-1` (2:44,
mais animada) e `vol-9` (1:54, mais calma); ambas fazem loop sem emenda audível na mixagem baixa.

## 4. Capítulos, capa e folha
```bash
python3 ferramentas/capitulos.py ../roteiro.json assets/segmentos.json > ../entrega/capitulos.txt
bash ferramentas/capa.sh ../render/tutorial-v1.mp4 <segundo>    # quadro assentado da abertura (título + passos já entraram)
bash ferramentas/folha.sh ../render/tutorial-v1.mp4 ../qa/folha-final.png
```
A capa (do /brag) vira `entrega/capa.jpg` e o quadro 0 do vídeo, então qualquer player mostra a capa parado.
Escolha o momento em que o título e a lista dos passos já entraram (no exemplo, ~8 s).

## 5. Verificar
```bash
python3 ferramentas/verificar.py .. --video render/tutorial-v1.mp4
```
Escreve `VERIFY.md`: formato, duração, áudio, voz de verdade, rótulos «» presentes nas telas, todo passo marcado,
nenhum dado sensível, capítulos, folha e capa. Tudo aprovado antes de mostrar. Depois, olhe a folha de quadros
com os olhos de quem nunca viu o sistema.

## 6. Arquivos de entrega
- `render/tutorial-v1.mp4`: o vídeo.
- `entrega/capa.jpg`: a miniatura para YouTube, LMS ou wiki.
- `entrega/capitulos.txt`: cole na descrição do YouTube.
- `entrega/descricao.txt`: 2 ou 3 frases sobre o que o vídeo ensina, os pré-requisitos, os capítulos e o crédito
  da trilha ("Música: Sascha Ende, ende.app (CC BY 4.0)") quando houver trilha.
- `MINUTAGEM.md`: passo a passo com tempo, fala, tela e ação (o mapa final, para quem for editar depois).
- `VERIFY.md` e `qa/`.

## 7. Responder à pessoa
Em poucas linhas: onde está o vídeo, a duração, LUFS e pico, os passos, a voz usada, quais telas foram capturadas e
quais recriadas, os dados fictícios, o que ficou em aberto. Ofereça um ajuste concreto (outra voz, outra trilha, um
passo mais devagar, a versão com a voz dela). Ajuste pedido → `tutorial-v<N+1>.mp4`; as versões anteriores
ficam em `render/`. **Nunca publique nem envie o vídeo.**
