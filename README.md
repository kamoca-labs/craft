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

Na raiz de tudo está uma regra: **menos código é melhor do que mais código**. Ela não é uma skill própria. Ela é o que `kiss` (reutilizar antes de escrever), `yagni` (só o que um uso atual exige) e `dry` (o código genérico nasce reutilizável) têm em comum. O `/craft:craft` e o passo 4 do `/craft:atdd` reforçam essa regra.

Cada princípio é uma skill própria, com regra, porquê, sinais de violação, como aplicar, exemplo antes/depois, limites e uma pergunta de verificação. Você não carrega uma por uma: o `/craft:craft` faz a triagem do código e carrega só as que têm sinal. Um hook dispara essa triagem sozinho logo depois que a suíte fica verde.

## Comandos

| Comando | Argumentos | O que faz |
|---|---|---|
| `/craft:craft` | `[arquivo ou escopo]` | Reforça a regra raiz (menos código é melhor do que mais código) e faz a triagem do código contra todos os princípios; carrega e aplica só as skills com sinal, e roda os testes dos domínios tocados no fim |
| `/craft:setup` | `[stack]` | Prepara o projeto: executor de teste, linter com limites de função (20 linhas), arquivo (200), parâmetros (3), aninhamento (2) e complexidade (10). O `/craft:craft` passa a rodar esse lint na triagem |
| `/craft:atdd` | `<o que deve mudar>` | Conduz os 7 passos: especificação Given/When/Then, um laço de teste, red, green e passing por cenário, refactor (via `/craft:craft`) e passing again. Aceita um refactor preparatório antes do laço, em commit próprio |
| `/craft:memory` | `[o que lembrar ou esquecer]` | Memória de longo prazo do projeto em `.claude/memory/`, no padrão da auto memory do Claude Code: o catálogo `MEMORY.md` e um arquivo por fato (`feedback`, `project`, `reference`). Vai para o git, então o time vê. O hook carrega a skill e o catálogo em toda sessão |
| `/craft:hook` | `<comportamento que não pode se repetir>` | Depois de uma correção sua, avalia se ela vira hook do projeto; se sim, propõe e, com o ok, escreve em TypeScript (`.claude/hooks/`, teste com `node:test`, mensagem pelo arquivo de tradução) e liga no `.claude/settings.json` |

Os comandos dos plugins sempre levam o prefixo, então o hub é `/craft:craft`, não `/craft` sozinho.

### Uma skill por princípio

Ficam fora do menu de `/` (`user-invocable: false`): a entrada é o `/craft:craft`, que carrega só as que têm sinal. Quando você já sabe o princípio, peça pelo nome ("aplica DRY em src/upload.ts"), e o Claude carrega a skill dele.

| Grupo | Skills |
|---|---|
| SOLID | `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion` |
| Simplicidade | `kiss`, `yagni`, `dry` |
| Performance | `performance` (no refactor, entende os dados, mede e compara formas, e fica com a que ganha com número) |
| Idioma | `i18n` (código em inglês, texto do usuário pelo i18n da stack) |
| Escrita | `ste` (respostas e textos no padrão ASD-STE100; carregada pelo hook em toda sessão, fora da triagem) |
| Clean Code | `naming`, `functions`, `arguments`, `guard-clauses`, `side-effects`, `comments`, `errors` |
| Testes | `clean-tests` (regras de todo teste e catálogo das camadas), `unit-tests` (unidade, componente e integração: a regra e os casos de borda), `e2e-tests` (só a jornada do usuário, sem estilo, `hover` nem campo a campo, só com a feature pronta e só em container), `test-ids` (`data-testid` com nome de negócio em todo elemento interativo, e o teste acha o elemento por ele) |

Quando os princípios brigam (DRY × KISS, inversão de dependência × YAGNI), a ordem de prioridade está em `skills/craft/SKILL.md`.

## Hooks

| Regra | Quando | O que faz |
|---|---|---|
| `ste` | no início, na retomada, no `/clear` e depois da compactação da sessão | Injeta a skill `craft:ste`: respostas e textos no padrão ASD-STE100 (frases curtas, voz ativa, uma instrução por frase, um termo por conceito). Em inglês vale a norma completa; em português, as regras que valem para qualquer língua |
| `memory` | no início, na retomada, no `/clear` e depois da compactação da sessão | Injeta a skill `craft:memory` e o catálogo `.claude/memory/MEMORY.md`. Catálogo grande é cortado numa linha inteira, abaixo do limite de 10.000 caracteres do contexto de hook, com aviso para ler o resto |
| `memory-outside-project` | antes de `Edit`/`Write` e de `Bash` | **Nega** gravar em `~/.claude/projects/*/memory/`, a auto memory local. Pelo shell, nega redirecionamento (`>`, `>>`) e `tee` para lá. Ler e apagar a memória local passa, para mover os fatos para o projeto |
| `atdd-first` | antes de `Edit`/`Write` em arquivo de código | **Nega** a edição se `craft:atdd` não foi carregada na sessão. Arquivo que não é código (`.md`, `.json`, `.yml`, `.env`) passa direto |
| `english-code` | antes de `Edit`/`Write` em arquivo de código | **Nega** texto novo com letra fora do ASCII (acento, outro alfabeto) em identificador, comentário ou string. Pastas de tradução (`lang/`, `locales/`, `i18n/`, `l10n/`, `translations/`), arquivos de teste e arquivos que não são código passam direto. Só o texto novo é checado, então editar arquivo legado não trava |
| `test-id` | antes de `Edit`/`Write` em `.vue`, `.jsx` e `.tsx` | **Nega** texto novo com elemento interativo sem `data-testid`: `button`, `a`, `input`, `select`, `textarea`, `form` e todo elemento com handler de `click`, `submit`, `change` ou `input`. Passam o `<input type="hidden">`, o wrapper que repassa os atributos do pai (`v-bind="$attrs"`, `{...rest}`) e os arquivos de teste. Só o texto novo é checado |
| `test-skip` | antes de `Edit`/`Write` em arquivo de teste | **Nega** texto novo que pula, foca ou desliga um teste: `.skip`, `.only`, `.todo`, `xit`, `fit`, `@pytest.mark.skip`, `t.Skip`, `#[ignore]`, `markTestSkipped`, `->skip()`, `@Disabled` |
| `e2e-container` | antes de `Bash` | **Nega** `playwright test`, `cypress run/open` e `artisan dusk` fora de `docker run`, `docker exec` e `docker compose run/exec` |
| `filtered-tests` | antes de `Bash` | **Nega** um executor de teste sem filtro (caminho, `related`, `--filter`, `-k`, `-t`, `-run`). A suíte completa passa só com a resposta `Rodar a suíte completa local` no `AskUserQuestion`, dada depois da última edição de código |
| `push-gate` | antes de `Bash` | Num projeto sem CI, **nega** `git push`, `gh pr create` e `glab mr create` até o usuário responder no `AskUserQuestion` se roda a suíte completa local. Com CI (`.github/workflows/`, `.gitlab-ci.yml` e afins), passa direto |
| `refactor-on-green` | depois de rodar testes com saída sem falha | Injeta a triagem do `craft:craft` (passo 6 do ATDD) |
