---
name: setup
description: Prepara um projeto para o craft. Configura executor de teste, linter com limites de tamanho e complexidade (função, classe, parâmetros, aninhamento) e scripts `test` e `lint`. Use ao começar um projeto novo ou quando o projeto ainda não tem lint com limites ou script de teste.
argument-hint: "[stack, se não der para detectar]"
---

# Setup de qualidade

Deixa o projeto pronto para `craft:atdd` e `craft:craft`: o que hoje é revisão no olho vira regra que o linter cobra.

## Como conduzir

1. **Detecte a stack** pelos manifestos (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`) e pelo gerenciador de pacote (lockfile). Se o projeto roda em container, os comandos rodam lá.
2. **Levante o que já existe**: executor de teste, linter, configs, scripts. Nunca substitua: complete o que falta e **nunca afrouxe** um limite que já é mais rígido.
3. **Mostre o plano e espere o ok**: dependências a instalar, arquivos a criar ou editar, limites. Uma tabela curta.
4. **Aplique**: instale com o gerenciador do projeto, escreva as configs, crie os scripts `test` e `lint`.
5. **Rode o lint** uma vez. Violações em código que já existe **não** são corrigidas agora: reporte a contagem por regra e sugira `/craft:craft` por módulo. Se forem muitas, ligue as regras de tamanho como aviso (`warn`) e diga isso no relatório.
6. **Reporte**: arquivos tocados, comandos de `test` e `lint`, violações existentes.

## Limites

Os mesmos números que as skills do craft usam como sinal, então o linter e a triagem falam a mesma língua.

| Limite | Valor | Skill que resolve a violação |
|---|---|---|
| Linhas por função | 20 (sem contar branco e comentário) | `craft:functions` |
| Linhas por arquivo/classe | 200 | `craft:single-responsibility` |
| Parâmetros | 3 | `craft:arguments` |
| Aninhamento | 2 níveis | `craft:guard-clauses` |
| Complexidade ciclomática | 10 | `craft:functions`, `craft:guard-clauses` |

Arquivos de teste ficam fora dos limites de linhas por função e por arquivo (um `describe` é longo por natureza).

## Por stack

| Stack | Ferramenta | Regras |
|---|---|---|
| JS/TS | ESLint (flat config, `eslint.config.js`) | `max-lines-per-function`, `max-lines`, `max-params`, `max-depth`, `complexity` |
| PHP | PHPMD (`phpmd.xml`) + Pint para estilo | `ExcessiveMethodLength`, `ExcessiveClassLength`, `ExcessiveParameterList`, `CyclomaticComplexity`, `NPathComplexity` |
| Python | Ruff (`pyproject.toml`) | `max-args`, `max-statements`, `max-branches`, `max-nested-blocks`, `mccabe.max-complexity` (selecione `PLR`, `C90`) |
| Go | golangci-lint (`.golangci.yml`) | `funlen`, `gocyclo`, `nestif`, `lll` |
| Rust | Clippy (`clippy.toml`) | `too-many-lines-threshold`, `too-many-arguments-threshold`, `cognitive-complexity-threshold` |

Executor de teste: o que o projeto já usa. Sem nenhum, o padrão da stack (vitest, pest, pytest, `go test`, `cargo test`). Confira que roda filtrado (veja a execução filtrada em `craft:atdd`).

## CLAUDE.md

Crie ou complete um CLAUDE.md mínimo com o contexto do projeto que o setup levantou:

```markdown
Toda mudança de comportamento segue `/craft:atdd`.
Referência, decisão ou escolha sobre o projeto mora no repo (CLAUDE.md, `docs/`), com caminho relativo. Nunca na memória local do Claude (`~/.claude/`) nem com caminho absoluto: só valeria nesta máquina e o time não veria.

## Comandos

- Testes: `<comando>`; filtrado: `<comando filtrado>`
- Lint: `<comando>`
```

Mais uma linha só se algo foge do padrão da stack (testes dentro de container, serviço que precisa estar de pé).

A linha da referência existe porque, sem ela, o modelo grava decisões do projeto na memória local dele, que não vai para o repo nem para o time.

A linha do ATDD é a única referência a skill: sem ela, o modelo só carrega o `craft:atdd` quando lembra, e o fluxo precisa valer desde o primeiro código. Não liste as demais skills, agents, hooks, princípios nem os limites do lint: o `craft:atdd` já leva ao `craft:craft`, o hook dispara a triagem e os limites estão no arquivo de config. Repetir gasta contexto em toda sessão e desatualiza.

## Fora do escopo

CI, hooks de pre-commit e formatação de código existente. Se o usuário pedir, faça em mudança separada.
