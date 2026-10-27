---
name: setup
description: Prepares a project for craft. Configures the test runner, a linter with size and complexity limits (function, class, parameters, nesting), and the `test` and `lint` scripts. Use when you start a new project, or when the project has no lint with limits or no test script yet.
argument-hint: "[stack, if it cannot be detected]"
---

# Quality setup

This skill gets the project ready for `craft:atdd` and `craft:craft`. What is a visual review today becomes a rule that the linter enforces.

## How to proceed

1. **Detect the stack** from the manifests (`package.json`, `composer.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`) and from the package manager (lockfile). If the project runs in a container, run the commands there.
2. **List what already exists**: test runner, linter, configs, scripts. Never replace: complete what is missing and **never loosen** a limit that is already stricter.
3. **Show the plan and wait for the ok**: dependencies to install, files to create or edit, limits. Use a short table.
4. **Apply**: install with the package manager of the project, write the configs, create the `test` and `lint` scripts.
5. **Run the lint** once. Do **not** fix violations in existing code now. Report the count per rule and suggest `/craft:craft` per module. If there are many, set the size rules as warnings (`warn`) and say so in the report.
6. **Report**: touched files, `test` and `lint` commands, existing violations.

## Limits

These are the same numbers that the craft skills use as a sign, so the linter and the screening speak the same language.

| Limit | Value | Skill that fixes the violation |
|---|---|---|
| Lines per function | 20 (not counting blank lines and comments) | `craft:functions` |
| Lines per file/class | 200 | `craft:single-responsibility` |
| Parameters | 3 | `craft:arguments` |
| Nesting | 2 levels | `craft:guard-clauses` |
| Cyclomatic complexity | 10 | `craft:functions`, `craft:guard-clauses` |

Test files are outside the limits of lines per function and per file (a `describe` is long by nature).

## By stack

| Stack | Tool | Rules |
|---|---|---|
| JS/TS | ESLint (flat config, `eslint.config.js`) | `max-lines-per-function`, `max-lines`, `max-params`, `max-depth`, `complexity` |
| PHP | PHPMD (`phpmd.xml`) + Pint for style | `ExcessiveMethodLength`, `ExcessiveClassLength`, `ExcessiveParameterList`, `CyclomaticComplexity`, `NPathComplexity` |
| Python | Ruff (`pyproject.toml`) | `max-args`, `max-statements`, `max-branches`, `max-nested-blocks`, `mccabe.max-complexity` (select `PLR`, `C90`) |
| Go | golangci-lint (`.golangci.yml`) | `funlen`, `gocyclo`, `nestif`, `lll` |
| Rust | Clippy (`clippy.toml`) | `too-many-lines-threshold`, `too-many-arguments-threshold`, `cognitive-complexity-threshold` |

Vue or React frontend: ask whether the production build must remove `data-testid`. If yes, configure the plugin of the stack listed in `craft:test-ids`. Never remove the attribute from the build that runs the E2E.

Test runner: the one the project already uses. If there is none, use the default of the stack (vitest, pest, pytest, `go test`, `cargo test`). Check that it runs filtered (see the filtered run in `craft:atdd`).

## CLAUDE.md

Create or complete a minimal CLAUDE.md with the project context that the setup found:

```markdown
Every behavior change follows `/craft:atdd`.
A reference, decision or choice about the project lives in the repo (CLAUDE.md, `docs/`, `.claude/memory/`), with a relative path. Never in the local memory of Claude (`~/.claude/`) and never with an absolute path: it would hold only on this machine and the team would not see it.

## Commands

- Tests: `<command>`, filtered: `<filtered command>`
- Lint: `<command>`
```

Add one more line only if something departs from the stack default (tests inside a container, a service that must be up).

The reference line exists because, without it, the model writes project decisions to its local memory. That memory does not go to the repo or to the team.

The ATDD line is the only reference to a skill. Without it, the model loads `craft:atdd` only when it remembers, and the flow must apply from the first code. Do not list the other skills, agents, hooks, principles or the lint limits. `craft:atdd` already leads to `craft:craft`, the hook triggers the screening, and the limits are in the config file. Repeating them spends context in every session and goes out of date.

## Out of scope

CI, pre-commit hooks and formatting of existing code. If the user asks, do it in a separate change.
