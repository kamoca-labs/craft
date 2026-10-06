# Plugin `craft`

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
claude plugin install craft@kauan
```

Requer Node 22.18+. Os comandos aparecem na próxima sessão. Clone e atualização estão no [README do repo](../../README.md#instalação).

## Visão geral

Boas práticas de programação para qualquer projeto: o fluxo **ATDD** em 7 passos e o **refactor guiado por princípios** (SOLID, KISS, YAGNI, DRY, Clean Code).

Cada princípio é uma skill própria, com regra, porquê, sinais de violação, como aplicar, exemplo antes/depois, limites e uma pergunta de verificação. Você não carrega uma por uma: o `/craft:craft` faz a triagem do código e carrega só as que têm sinal. Um hook dispara essa triagem sozinho logo depois que a suíte fica verde.

## Comandos

| Comando | Argumentos | O que faz |
|---|---|---|
| `/craft:craft` | `[arquivo ou escopo]` | Triagem do código contra todos os princípios; carrega e aplica só as skills com sinal, e roda os testes dos domínios tocados no fim |
| `/craft:atdd` | `<o que deve mudar>` | Conduz os 7 passos: especificação Given/When/Then, teste, red, green, passing, refactor (via `/craft:craft`), passing again |

Os comandos dos plugins sempre levam o prefixo, então o hub é `/craft:craft`, não `/craft` sozinho.

### Uma skill por princípio

Dá para chamar direto quando você já sabe o que quer (`/craft:dry src/upload.ts`), e o Claude também escolhe sozinho pela descrição de cada uma.

| Grupo | Skills |
|---|---|
| SOLID | `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion` |
| Simplicidade | `kiss`, `yagni`, `dry` |
| Clean Code | `naming`, `functions`, `arguments`, `guard-clauses`, `side-effects`, `comments`, `errors`, `clean-tests` |

Quando os princípios brigam (DRY × KISS, inversão de dependência × YAGNI), a ordem de prioridade está em `skills/craft/SKILL.md`.
