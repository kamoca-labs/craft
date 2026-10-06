# Plugin `practices`

## Sumário

- [Instalação](#instalação)
- [Visão geral](#visão-geral)
- [Comandos](#comandos)
- [Hooks](#hooks)
- [Origem](#origem)
- [Arquivos](#arquivos)
- [Casos de uso](USAGE.md)

## Instalação

```bash
claude plugin marketplace add ~/Development/claude-plugins
claude plugin install practices@kauan
```

Requer Node 22.18+. Os comandos aparecem na próxima sessão. Clone e atualização estão no [README do repo](../../README.md#instalação).

## Visão geral

Boas práticas de programação para qualquer projeto: o fluxo **ATDD** em 7 passos e os princípios de **refactor** (SOLID, KISS, YAGNI, DRY, Clean Code). Um hook lembra o refactor no momento certo, logo depois que a suíte fica verde, sem você precisar pedir.

## Comandos

| Comando | Argumentos | O que faz |
|---|---|---|
| `/practices:atdd` | `<o que deve mudar>` | Conduz os 7 passos: especificação Given/When/Then, teste, red, green, passing, refactor, passing again |
| `/practices:refactor` | `[arquivo ou escopo]` | Aplica os princípios e o checklist do passo 6 ao código indicado ou ao que mudou |

As duas skills também são escolhidas pelo Claude quando a tarefa casa com a descrição delas (feature nova, correção de bug, pedido de refactor).

## Hooks

| Hook (`hooks/rules/`) | Evento | Quando dispara | O que faz |
|---|---|---|---|
| `refactor-on-green` | depois de um comando Bash | o comando roda testes e a saída não mostra falha | injeta o conteúdo da skill `refactor` como contexto (passo 6 do ATDD) |

Executores reconhecidos: vitest, jest, pest, phpunit, pytest, `artisan test`, `node --test`, `npm`/`pnpm`/`yarn`/`bun test`, `go test`, `cargo test`, `mvn test`, `gradle test`.

A falha é lida da **saída**, não só do exit code, porque um pipe (`pnpm test | tail`) esconde o código de saída. Padrões de falha: `N failed`, `FAIL`, `FAILED`, `FAILURES!`, `ERRORS!`, `ELIFECYCLE`, `No test files found`, `# fail N`, `not ok N`.

Os princípios moram só em `skills/refactor/SKILL.md`. O hook lê esse arquivo, então editar a skill muda também o que é injetado.

## Origem

Adaptado das regras do projeto `huginn` (`.claude/rules/atdd.md`, `.claude/principles/refactor.md`, `.claude/hooks/load-refactor-principles.sh`), sem as partes específicas de lá (Nuxt, i18n, ESLint em container).

## Arquivos

| Caminho | Papel |
|---|---|
| `skills/atdd/SKILL.md` | os 7 passos e as regras do ATDD |
| `skills/refactor/SKILL.md` | os princípios e o checklist; fonte única do que o hook injeta |
| `hooks/hooks.json` | um hook por regra |
| `hooks/lib.ts` | leitura do payload, leitura da skill, injeção de contexto e captura de caso real |
| `hooks/rules/<regra>.ts` | uma regra por arquivo |
| `hooks/tests/<regra>.test.ts` | os casos de cada regra, isolada |
| `hooks/tests/cases.json` | casos de uso de ponta a ponta: cada um declara quais hooks injetam |
| `hooks/tests/cases.test.ts` | roda o `cases.json` contra o `hooks.json` |
| `hooks/tests/structure.test.ts` | garante que toda regra tem hook dedicado e teste próprio |

Rodar: `node --test 'hooks/tests/*.test.ts'`. Cada injeção em uso real vai para `~/.claude/hook-cases.jsonl` com `inject` no lugar de `deny`; veja [transformar caso real em teste](../../USAGE.md#transformar-caso-real-em-teste).
