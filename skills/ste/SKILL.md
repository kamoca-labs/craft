---
name: ste
description: Escrita no padrão ASD-STE100 (Simplified Technical English, Issue 9) em toda resposta e todo texto escrito (doc, commit, PR/MR, mensagem de erro, skill). Carregada em toda sessão pelo hook ste; use também ao revisar um texto que ficou longo, ambíguo ou difícil de seguir.
user-invocable: false
---

# Escrita no padrão ASD-STE100

**Regra**: toda resposta ao usuário e todo texto que você escreve seguem o ASD-STE100 (Simplified Technical English, Issue 9, 2025). O objetivo é um texto com um sentido só, que qualquer leitor entende na primeira leitura, inclusive quem não tem a língua do texto como nativa ou usa tradução automática.

## Onde vale

- **Texto em inglês** (commit, PR/MR, doc, README, mensagem do locale `en`, comentário de review): aplique o STE completo, com todas as regras abaixo.
- **Texto em português** (respostas, docs, skills, mensagens de hook): o STE é uma norma do inglês, então aplique as regras que valem para qualquer língua: tamanho de frase e de parágrafo, uma instrução por frase, imperativo, voz ativa, verbo em vez de substantivo, um termo por conceito e lista vertical. Mantenha a ortografia e os acentos corretos.
- **Fora do escopo**: identificadores de código, comandos, saídas de ferramenta e citações literais. Não reescreva o que o usuário colou.

## Palavras

- Use palavras comuns, com **um sentido só**. Uma palavra que tem dois sentidos possíveis gera dúvida: troque por uma que tem um sentido só.
- Use cada palavra numa classe gramatical só: o que é verbo fica verbo, o que é substantivo fica substantivo.
- Use **um termo para cada coisa** e mantenha o mesmo termo no texto inteiro. Sinônimo para variar o estilo faz o leitor pensar que são duas coisas diferentes. Ex.: revisão de código é sempre "PR/MR"; se o usuário disser PR, MR, pull request ou merge request, é a mesma coisa.
- Nomes técnicos (arquivo, comando, API, nome de produto) entram como são, mas sempre o mesmo nome para a mesma coisa. Prefira o nome curto e conhecido.
- Não use gíria, regionalismo nem jargão interno sem explicar.
- Em inglês: não use phrasal verb que tem uma alternativa de uma palavra só ("remove", e não "take out"). Use a grafia americana.

## Grupos de substantivos

- No máximo **3 substantivos em sequência**. "Hook config file path override" vira "the path that overrides the hook configuration".
- Um nome técnico mais longo pode aparecer por extenso uma vez. Depois, use uma forma curta.

## Verbos

- Use **voz ativa**: "o hook nega a edição", e não "a edição é negada pelo hook". Use a passiva só quando o agente é desconhecido.
- Use os tempos simples: presente, passado e futuro. Evite tempos compostos e locuções verbais longas ("vai estar sendo feito").
- A ação é um **verbo**, não um substantivo: "verifique a config", e não "faça a verificação da config". Em inglês: "check", e não "perform a check of".
- Em inglês, use a forma "-ing" só dentro de um nome técnico. Em português, não encadeie gerúndios ("vamos estar enviando").

## Frases

- **Procedimento** (passo a passo, instrução): no máximo **20 palavras** por frase.
- **Texto descritivo** (explicação, contexto): no máximo **25 palavras** por frase.
- Não corte palavras para encurtar a frase, como artigos, preposições e conectivos. Em inglês, não use contração ("do not", e não "don't").
- Quando o conteúdo é complexo (opções, condições, passos), use uma **lista vertical**.
- Use conectivos ("então", "por isso", "depois") para ligar frases do mesmo assunto.
- Use artigo ou demonstrativo antes do substantivo quando cabe ("o arquivo", e não só "arquivo").

## Procedimentos

- Uma **instrução por frase**. Junte duas ações só quando elas acontecem ao mesmo tempo.
- Escreva a instrução no **imperativo**: "Rode `npm test`", e não "Você pode rodar `npm test`".
- Quando a instrução começa por uma condição, separe a condição com vírgula: "Se o teste falhar, volte ao passo 4."
- Uma nota só informa. Ela nunca carrega uma instrução escondida.

## Texto descritivo

- Um **assunto por parágrafo**.
- No máximo **6 frases por parágrafo**.
- Comece pela informação mais importante, que é o resultado, a resposta ou a decisão. O contexto vem depois.

## Avisos

Antes de um comando destrutivo, de uma ação irreversível ou de um risco de dado:

1. Comece pelo nível de risco ("Atenção", "Cuidado").
2. Diga a ordem ou a condição de forma clara.
3. Explique o risco ou o resultado possível.

Exemplo: "Atenção: não rode `git reset --hard` com mudança pendente. O comando apaga as mudanças que não estão em commit."

## Pontuação

- **Não use ponto e vírgula**. Divida o trecho em duas frases.
- Use hífen para ligar palavras relacionadas diretamente.
- Use parênteses com moderação. O texto entre parênteses conta como uma palavra só.

## Prática

- Quando trocar uma palavra não basta, reescreva a frase com outra estrutura.
- Releia antes de enviar. Divida toda frase acima do limite, troque toda passiva que tem agente conhecido e todo sinônimo que muda um termo já usado.

## Verificação

> Cada frase tem um sentido só, cabe no limite de palavras, tem verbo ativo e usa o mesmo termo para a mesma coisa? Cada instrução está no imperativo, uma por frase?
