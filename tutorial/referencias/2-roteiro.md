# 2 · Roteiro

Dois arquivos na pasta do projeto: `plano.md` (para a pessoa aprovar) e `roteiro.json` (o que a narração fala e
o que as cenas usam). O roteiro é o contrato: as cenas só fazem o que a fala diz, na hora em que a fala diz.

## plano.md (uma página)
```markdown
# Tutorial: [tarefa] no [sistema]
- Público: [quem assiste e o que já sabe]
- Pré-requisitos: [login, perfil, dado prévio]
- Duração alvo: [2–5 min] · Formato: 1920×1080, 30 qps
- Telas: [lista: id — capturada | recriada do código — rota]
- Dados fictícios: [o que será digitado/exibido]
- Voz: [sintética pf_dora | sua voz | outra]
- Trilha: [faixa | nenhuma]

## Passos
1. [Título] — tela → ação (rótulo exato) → resultado
2. …

## Onde as pessoas erram
- [ponto] → [como o vídeo trata: aviso, balão, zoom]
```

## roteiro.json
```json
{
  "produto": "Nome do sistema",
  "titulo": "Como [tarefa] no [sistema]",
  "voz": "pf_dora",
  "aberturaTitulo": "Introdução",
  "encerramentoTitulo": "Resumo",
  "passos": [ { "n": 1, "titulo": "Abrir a lista de produtos", "sub": "Menu lateral › Produtos" } ],
  "segmentos": [
    { "id": "abertura-1", "passo": 0, "texto": "Neste vídeo você vai aprender a …" },
    { "id": "p1-a", "passo": 1, "texto": "No menu lateral, clique em «Produtos»." }
  ],
  "pausas": { "inicio": 0.5, "entreFrases": 0.35, "entrePassos": 0.85 }
}
```
- `passo: 0` = abertura (antes do passo 1) ou encerramento (depois do último).
- Um segmento = uma ou duas frases curtas = uma ideia. Os `id` são estáveis (`p3-c`) porque as cenas ancoram
  neles (`K.seg("p3-c")`, `K.em("p3-c", "cozinha")`).
- **Rótulos da interface entre «».** A voz lê sem as aspas, a legenda pinta o rótulo e o `verificar.py` confere
  que cada rótulo existe numa tela. Escreva o rótulo exatamente como está na tela.
- `pausaDepois` num segmento troca a pausa padrão quando a tela precisa de tempo (uma transição, um carregamento).

## Como escrever a fala
- **Segunda pessoa, verbo no imperativo, frases curtas:** "Clique em «Salvar produto»." "Em «Categoria», escolha
  «Cozinha»."
- **Uma ação por frase** (T3). Explicação antes ("Esta é a lista com todos os produtos") ou depois ("O aviso
  confirma que deu certo"), nunca no meio da instrução.
- **Diga onde fica** antes de mandar clicar quando o alvo não é óbvio: "no menu lateral, à esquerda", "no canto
  superior direito".
- **Diga o que digitar**, por extenso, do jeito que se fala: "oitenta e nove e noventa". A tela mostra "89,90".
- **Antecipe o erro** que a inspeção achou: "digite só os números, com vírgula nos centavos".
- **Feche cada passo com o resultado** visível: "Abre o formulário do produto."
- Abertura: o que a pessoa vai conseguir fazer e os passos, em 2 ou 3 frases. Nada de cumprimento nem de
  apresentação pessoal.
- Encerramento: a recapitulação dos passos em uma frase e, se fizer sentido, o próximo tutorial.
- Números e siglas como se falam ("três", "CNPJ" → "cê ene pê jota" só se a voz sintética errar; teste no rascunho).
- Nada de "simples", "fácil", "basta", "rapidinho": se fosse óbvio, ninguém veria o vídeo.

## Duração
A 150 palavras/min, 2 minutos são ~300 palavras, e 5 minutos são ~750. Conte as palavras antes de gerar a voz.
- Abertura 10–20 s · cada passo 15–60 s · encerramento 8–15 s.
- Passou de 5 min → divida a tarefa em dois tutoriais (T6).
- Ficou abaixo de 2 min com tudo explicado? Tudo bem: o alvo é ensinar, não encher. O `verificar.py` reprova
  abaixo de 1min40; nesse caso, confira se não faltou um passo ou um "onde as pessoas erram".

## O portão
Mostre à pessoa os **passos** e as **falas** (o roteiro em texto corrido, um segmento por linha) e espere o OK.
Só ela sabe se o processo do negócio está certo (um campo que a equipe sempre deixa em branco, um passo que a
empresa faz diferente). Pule o portão só se ela disser para ir direto.
