# Lint tool and rules by stack

Read this when you configure the linter.

| Stack | Tool | Rules |
|---|---|---|
| JS/TS | ESLint (flat config, `eslint.config.js`) | `max-lines-per-function`, `max-lines`, `max-params`, `max-depth`, `complexity` |
| PHP | PHPMD (`phpmd.xml`) + Pint for style | `ExcessiveMethodLength`, `ExcessiveClassLength`, `ExcessiveParameterList`, `CyclomaticComplexity`, `NPathComplexity` |
| Python | Ruff (`pyproject.toml`) | `max-args`, `max-statements`, `max-branches`, `max-nested-blocks`, `mccabe.max-complexity` (select `PLR`, `C90`) |
| Go | golangci-lint (`.golangci.yml`) | `funlen`, `gocyclo`, `nestif`, `lll` |
| Rust | Clippy (`clippy.toml`) | `too-many-lines-threshold`, `too-many-arguments-threshold`, `cognitive-complexity-threshold` |
