# Regras do tutorial — valem para todo vídeo

*O /brag deu a disciplina de mostrar a coisa de verdade sem inventar nada. A reel deu a disciplina de produção
(âncora na fala, áudio, verificação). Quando uma regra daqui conflitar com o que parecer mais bonito, **vale esta**.*

## T1 · Mostre a coisa de verdade
- As telas são o sistema: capturadas do servidor local ou recriadas do código com a mesma estrutura, os mesmos
  rótulos e as mesmas cores. Nunca redesenhe a interface "para ficar mais bonita".
- Nenhum botão, menu, campo, mensagem ou atalho que o código não tenha. Se a voz manda clicar em «Salvar», o botão
  diz "Salvar" (o `verificar.py` confere todo rótulo entre «»).
- Comportamento também: a ordem dos campos, a validação, o aviso de sucesso e para onde a tela vai depois de salvar
  são os do código. Se não deu para confirmar no código, pergunte em vez de supor.
- Afirmação sobre o sistema ("leva menos de um minuto", "o código é gerado sozinho") precisa estar no código ou ser
  dita pela pessoa. A frase de ligação é livre ("Agora, a parte que mais gera dúvida").

## T2 · Nada secreto sai daqui
Tudo o que aparece pode virar vídeo público. Nunca leve para o roteiro, as telas, o vídeo ou a descrição:
segredos, chaves, tokens, endereços internos, nomes ou e-mails de clientes reais, CPF/CNPJ reais, dados pessoais.
Use dados fictícios e plausíveis: nomes inventados, `@exemplo.com`, CNPJ de teste, produtos de mentira coerentes
com o negócio. Diga no `plano.md` quais dados são fictícios. Não leia `.env*`, chaves, `secrets/`, `credentials/`,
lock files nem build. A captura só aceita servidor local.

## T3 · Uma ação por frase, na palavra
- Cada frase de instrução tem uma ação: "Clique em «Novo produto»." Explicação vem antes ou depois, nunca no meio.
- A voz diz o rótulo exato que está na tela, do jeito que está escrito.
- A ação acontece na palavra: o clique estala em `K.em("p2-c", "novo produto")`, a digitação começa no texto que está
  sendo ditado. Nunca chute um tempo; se a frase não existe na narração, o `K.at` dá erro, e isso é bom.

## T4 · O espectador sempre acha onde está
- Comece cada região no plano geral; aproxime (`K.foco`) só quando o alvo for pequeno ou houver detalhe a ler.
  Volte ao geral (`K.geral`) antes de mudar de região da tela ou de tela.
- Zoom de 1,4 a 2,0. Mais que isso borra o texto e desorienta.
- O cursor aparece em toda ação e anda em linha suave (o kit cuida). Nada de teleporte entre cliques distantes:
  dê tempo ao `K.mover`.
- Nada cobre o alvo: nem cartela, nem balão, nem aviso, nem legenda. O balão (`K.nota`) vai ao lado do campo, e a
  cartela do passo aparece com a câmera no geral, antes da primeira ação.
- A barra da janela mostra o passo atual (`K.passo`) do começo ao fim de cada passo.

## T5 · Ritmo de tutorial (mais calmo que o reel)
- Algo muda a cada 3 a 6 s: clique, digitação, destaque, zoom ou troca de tela. Nenhuma tela fica parada mais de
  8 s; se a fala é longa, use `K.destacar`, `K.nota` ou `K.respirar`.
- Texto que se lê fica ≥ 0,3 s por palavra depois de assentado (regra do /brag). A cartela do passo fica ≥ 2,2 s.
- Narração entre 140 e 170 palavras por minuto. Pausa maior entre passos (0,8 s) que entre frases (0,35 s).

## T6 · Duração e estrutura
- **2 a 5 minutos.** Ensinar uma tarefa. Mais de 5 min → divida em dois tutoriais (pergunte qual vem primeiro).
- Abertura de 10 a 20 s (o que a pessoa vai conseguir fazer + a lista dos passos) → os passos → encerramento de 8 a
  15 s (recapitulação com os passos ticando). Nada de "olá, tudo bem, hoje…".
- Capítulos: um por passo (`ferramentas/capitulos.py`), cada um com 10 s ou mais.

## T7 · Som com parcimônia
- Trilha baixa por baixo da voz (−21 dB, abaixando sozinha quando a voz fala — `audio-final.sh`). `--sem trilha`
  quando a pessoa pedir ou o tom for sério.
- Efeito só em ação de verdade: clique, digitação (contínua, ~12 dB abaixo da voz), troca de tela, sucesso.
  Nada em cada destaque ou balão. Teto de ~0,5 efeito/s; o kit já ignora sons pequenos colados (< 0,6 s).
- Sons do kit: os procedurais da reel e os da Kenney (CC0) que o /brag marcou como de baixo risco de agudo.

## T8 · Áudio final
−14 LUFS integrado (±0,5) e pico verdadeiro ≤ −1 dBTP, sem recodificar a imagem (`audio-final.sh`, mesma
calibração da reel). É o alvo do YouTube e soa bem em reunião e em treinamento.

## T9 · Verificação antes de entregar
1. lint com 0 erros; 2. snapshot em cada passo, clique, zoom e troca de tela; 3. cursor no alvo, nada cobrindo a
ação, texto legível; 4. render; 5. áudio (T8); 6. folha de quadros; 7. `verificar.py` → `VERIFY.md` todo aprovado.
**Nunca publicar nem enviar o vídeo.**

## T10 · Ambiente isolado
Os caminhos vêm de variáveis de ambiente (`TUTORIAL_TTS`, `WHISPER_MODEL`, `CHROME`), nunca de pastas fixas do
usuário. O sistema é servido localmente para a captura e a skill não instala nada fora da pasta do motor sem
perguntar.

## T11 · Créditos
As trilhas de `assets/musica/` são CC BY 4.0: o crédito vai na descrição (`entrega/descricao.txt`):
"Música: Sascha Ende, ende.app (CC BY 4.0)". Os efeitos não pedem crédito (procedurais e CC0), e as fontes são OFL.
