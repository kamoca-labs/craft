---
name: hook
description: Transforma uma correção do usuário em hook do projeto, para o erro não se repetir. Use quando o usuário corrigir algo que você fez (comando, arquivo, padrão de código) e a regra puder ser checada pela entrada da ferramenta, ou quando pedirem para criar um hook ou uma regra garantida no projeto.
argument-hint: "<comportamento que não pode se repetir>"
---

# Correção vira hook

Correção lembrada se perde na próxima sessão; correção garantida por hook não volta. Sempre que o usuário corrigir você, delibere se a correção cabe num hook.

## Quando vale um hook

Faça as três perguntas. Hook só com três sim:

1. **Repete?** A correção é sobre um padrão (todo commit, todo arquivo de migração, todo `docker compose`), não sobre um caso único.
2. **É checável pela entrada?** Dá para decidir só com o que a ferramenta recebe (caminho, conteúdo, comando, saída do comando), por regex ou leitura simples de arquivo, sem julgamento.
3. **Erra pouco?** O padrão negado não pega uso legítimo. Falso positivo trava o trabalho e custa mais que o erro que evita.

Confira cada pergunta contra a correção concreta antes de propor:

| Correção | Repete? | Checável? | Erra pouco? | Resultado |
|---|---|---|---|---|
| "commit sem `Co-Authored-By`" | sim, todo commit | sim, a mensagem está no comando `git commit` | sim, o trailer é literal | hook que nega (como o `git:no-co-author`) |
| "nunca `git add .env`" | sim | sim, pelo comando | sim | hook que nega |
| "esse nome de variável não diz nada" | sim | não, exige julgamento | não | skill `craft:naming` |
| "neste arquivo, use a lib X" | não, caso único | sim | sim | só a correção |

Se a resposta for não:

| Situação | Onde a correção fica |
|---|---|
| Exige julgamento (design, nome bom, escolha de biblioteca) | skill do assunto, ou o CLAUDE.md se for contexto do projeto |
| Caso único | só a correção, sem registro |
| Contexto útil depois de um evento (ex.: suíte verde) | hook que **injeta** contexto, em vez de negar |

**Proponha e espere o ok**: diga a correção, a regra, o evento (`PreToolUse`, `PostToolUse` ou `Stop`, e o matcher), um exemplo negado e um liberado. Hook é imposição; quem decide é o usuário.

## Duas camadas

Escolha o evento pelo custo e pela certeza da checagem:

| Checagem | Evento | Exemplo |
|---|---|---|
| Mecânica, barata e sem ambiguidade | `PreToolUse`: nega na hora, antes da ferramenta rodar | `git add .env`, `.only` num teste |
| Cara, ou que pede o julgamento do modelo | `Stop`: roda uma vez no fim, sobre os arquivos tocados na sessão | lint de vários arquivos, heurística que pode errar |

- As duas camadas passam pelas três perguntas acima. No `Stop`, o hook acha o candidato, e o modelo julga cada achado.
- Na dúvida entre as duas, escolha o `Stop`. Uma negação na hora interrompe o trabalho, então ela precisa estar certa.
- O `Stop` lê só os arquivos tocados na sessão (pelo transcript ou pelo `git diff`), não o projeto inteiro.
- O `Stop` não repete o achado que a camada do `PreToolUse` já reportou.
- Para reportar, o `Stop` sai com `exit 2` e a lista de achados no stderr. Sem achado novo, ele sai com `exit 0`, em silêncio.
- Se a entrada traz `stop_hook_active` verdadeiro, libere. Os achados já saíram uma vez.

## Como escrever

- **TypeScript**, rodado direto com `node` (Node 22.18+ executa `.ts` sem build), sem dependência: só `node:fs`, `node:path`, `node:test`. Mesmo em projeto PHP ou Python, o hook é TypeScript.
- **Código em inglês**; a mensagem que o usuário lê vem do arquivo de tradução, na língua dele (`craft:i18n`).
- **Siga o `craft:atdd`**: o teste do hook vem antes da regra e falha primeiro.
- Uma regra por arquivo e por entrada no settings; nega só o padrão exato da correção.
- Negar: mensagem no stderr e `exit 2` (a mensagem diz o que fazer em vez disso). Injetar: JSON com `hookSpecificOutput.additionalContext` no stdout e `exit 0`.
- Na dúvida (arquivo ilegível, entrada inesperada), libere: hook quebrado não pode travar a sessão.

Layout no projeto (commitado, para valer para todo o time):

```
.claude/
  settings.json            # liga cada regra no evento
  hooks/
    lib.ts                 # readInput, deny, message
    locales/pt-BR.json     # mensagens para o usuário
    rules/<rule>.ts
    tests/<rule>.test.ts   # node --test .claude/hooks/tests/
```

```ts
// .claude/hooks/rules/no-env-commit.ts
import { deny, readInput } from '../lib.ts'

const input = readInput()

if (/\bgit\s+add\b.*\.env\b/.test(input.tool_input.command || '')) {
  deny('no-env-commit')
}
```

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/rules/no-env-commit.ts\"", "timeout": 10 }]
      }
    ]
  }
}
```

Se o projeto já tem hooks, siga o layout e a lib que existem.

## Depois de criar

- Rode os testes do hook e mostre um caso negado e um liberado.
- Diga ao usuário que o hook vale a partir da próxima sessão.
- Se a correção valia para todo projeto, não só este, sugira levá-la para um plugin.

## Quando um hook do projeto nega

Todo achado de um hook cai num destes três casos:

| Caso | O que fazer |
|---|---|
| Problema real | Corrija o que o hook apontou. |
| Falso positivo com evidência | Registre a exceção mais estreita possível no repo, com o motivo. Diga a exceção na resposta. |
| Dúvida | Deixe o achado de pé. Pergunte ao usuário uma vez, numa linha. |

- Evidência é um fato que você consegue citar: uma fixture de teste, um exemplo proposital na doc, uma escolha que o usuário já confirmou.
- O motivo segue o formato `"<quem decidiu>: <evidência>"`. Ex.: `"usuário confirmou: o seed usa nomes de cidade em português"`.
- Escreva "usuário confirmou" só quando o usuário confirmou de fato.
- A exceção mais estreita cobre um valor, uma linha ou um caminho. Exceção ampla (arquivo inteiro, regra inteira) só com o pedido do usuário.
- Nunca use uma exceção para forçar a passagem de uma edição negada.
- Registre a exceção onde a regra já aceita uma (uma lista na própria regra), com um teste do caso liberado. O motivo vai no body do commit.

Esta seção é uma política, não um mecanismo. Não crie código novo só para registrar exceções.
