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
claude plugin install craft@kamoca
```

Requer Node 22.18+. Os comandos aparecem na próxima sessão. Clone e atualização estão no [README do repo](../../README.md#instalação).

## Visão geral

Boas práticas de programação para qualquer projeto: o fluxo **ATDD** em 7 passos e o **refactor guiado por princípios** (SOLID, KISS, YAGNI, DRY, Clean Code).

Cada princípio é uma skill própria, com regra, porquê, sinais de violação, como aplicar, exemplo antes/depois, limites e uma pergunta de verificação. Você não carrega uma por uma: o `/craft:craft` faz a triagem do código e carrega só as que têm sinal. Um hook dispara essa triagem sozinho logo depois que a suíte fica verde.

## Comandos

| Comando | Argumentos | O que faz |
|---|---|---|
| `/craft:craft` | `[arquivo ou escopo]` | Triagem do código contra todos os princípios; carrega e aplica só as skills com sinal, e roda os testes dos domínios tocados no fim |
| `/craft:setup` | `[stack]` | Prepara o projeto: executor de teste, linter com limites de função (20 linhas), arquivo (200), parâmetros (3), aninhamento (2) e complexidade (10). O `/craft:craft` passa a rodar esse lint na triagem |
| `/craft:atdd` | `<o que deve mudar>` | Conduz os 7 passos: especificação Given/When/Then, teste, red, green, passing, refactor (via `/craft:craft`), passing again |

Os comandos dos plugins sempre levam o prefixo, então o hub é `/craft:craft`, não `/craft` sozinho.

### Uma skill por princípio

Ficam fora do menu de `/` (`user-invocable: false`): a entrada é o `/craft:craft`, que carrega só as que têm sinal. Quando você já sabe o princípio, peça pelo nome ("aplica DRY em src/upload.ts"), e o Claude carrega a skill dele.

| Grupo | Skills |
|---|---|
| SOLID | `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion` |
| Simplicidade | `kiss`, `yagni`, `dry` |
| Idioma | `i18n` (código em inglês, texto do usuário pelo i18n da stack) |
| Clean Code | `naming`, `functions`, `arguments`, `guard-clauses`, `side-effects`, `comments`, `errors`, `clean-tests` |

Quando os princípios brigam (DRY × KISS, inversão de dependência × YAGNI), a ordem de prioridade está em `skills/craft/SKILL.md`.

## Hooks

| Regra | Quando | O que faz |
|---|---|---|
| `atdd-first` | antes de `Edit`/`Write` em arquivo de código | **Nega** a edição se `craft:atdd` não foi carregada na sessão. Arquivo que não é código (`.md`, `.json`, `.yml`, `.env`) passa direto |
| `english-code` | antes de `Edit`/`Write` em arquivo de código | **Nega** texto novo com letra fora do ASCII (acento, outro alfabeto) em identificador, comentário ou string. Pastas de tradução (`lang/`, `locales/`, `i18n/`, `l10n/`, `translations/`), arquivos de teste e arquivos que não são código passam direto. Só o texto novo é checado, então editar arquivo legado não trava |
| `refactor-on-green` | depois de rodar testes com saída sem falha | Injeta a triagem do `craft:craft` (passo 6 do ATDD) |
