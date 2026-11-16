# Lint tool and rules by stack

Read this when you configure the linter.

| Stack | Tool | Rules |
|---|---|---|
| JS/TS | ESLint (flat config, `eslint.config.js`) | `max-lines-per-function`, `max-lines`, `max-params`, `max-depth`, `complexity` |
| PHP | PHPMD (`phpmd.xml`) + Pint for style | `ExcessiveMethodLength`, `ExcessiveClassLength`, `ExcessiveParameterList`, `CyclomaticComplexity`, `NPathComplexity` |
| Python | Ruff (`pyproject.toml`) | `max-args`, `max-statements`, `max-branches`, `max-nested-blocks`, `mccabe.max-complexity` (select `PLR`, `C90`) |
| Go | golangci-lint (`.golangci.yml`) | `funlen`, `gocyclo`, `nestif`, `lll` |
| Rust | Clippy (`clippy.toml`) | `too-many-lines-threshold`, `too-many-arguments-threshold`, `cognitive-complexity-threshold` |

Playwright E2E in a JS/TS project: add `eslint-plugin-playwright` (`flat/recommended`) for the files of `e2e/**` and `@typescript-eslint/no-floating-promises`. Read the rules of the installed version in `playwright.configs['flat/recommended']`, because the set changes between versions. The size limits do not apply to `e2e/**` specs (a `describe` is long by nature).
