<p align="center">
  <img src="./assets/icon.png" alt="Craft plugin blueprint icon" width="180">
</p>

# Plugin `craft`

## Contents

- [Installation](#installation)
- [Overview](#overview)
- [Commands](#commands)
- [Hooks](#hooks)
- [Use cases](USAGE.md)
- [Release notes](CHANGELOG.md)

## Installation

```bash
claude plugin marketplace add kamoca-labs/marketplace
claude plugin install craft@kamoca
```

The plugin needs Node 22.18 or later. The commands appear in the next session. The update steps are in the [marketplace README](https://github.com/kamoca-labs/marketplace#installation).

## Overview

Good programming practices for any project: the **ATDD** flow in 7 steps and the **principle-guided refactor** (SOLID, KISS, YAGNI, DRY, Clean Code).

One rule is the root of everything: **less code is better than more code**. It is not a skill of its own. It is what `kiss` (reuse before you write), `yagni` (write only what a current use needs), and `dry` (generic code is born reusable) have in common. `/craft:craft` and step 4 of `/craft:atdd` enforce this rule.

Each principle is a reference file in `skills/craft/references/`, with a rule, a reason, violation signals, how to apply it, a before/after example, limits, and a check question. Claude reads a reference only when it needs it, so the principles cost no context until then. `/craft:craft` triages the code and reads only the references that have a signal. A hook starts this triage by itself right after the suite turns green.

## Commands

| Command | Arguments | What it does |
|---|---|---|
| `/craft:craft` | `[request, file or scope]` | For a request to implement, fix, refactor, migrate or write, builds a linear activity in `.claude/local/activities/<slug>/index.md` and works one verified item at a time (see `USAGE.md`, "Big requests"). Also enforces the root rule (less code is better than more code) and triages the code against all principles. It loads and applies only the skills with a signal, and at the end runs the tests of the touched domains. The check has one triage round, one batch of fixes, and at most one confirmation round. When the change alters the UI, it suggests `/design:review` and does not run it |
| `/craft:setup` | `[stack]` | Prepares the project: test runner and linter with limits for function (20 lines), file (200), parameters (3), nesting (2), and complexity (10). `/craft:craft` then runs this lint in the triage |
| `/craft:atdd` | `<what must change>` | Runs the 7 steps: Given/When/Then specification (with the list of real-world edge cases: long text, emoji, timeout, 403, double submit), a loop of test, red, green, and passing per scenario, refactor (through `/craft:craft`), and passing again. Each acceptance criterion names an observable value and the test that proves it. After the user approves the specification, it opens an activity with one item per scenario, and the `activity-gate` Stop hook holds the end of the turn until every item has evidence. It accepts a preparatory refactor before the loop, in its own commit |
| `/craft:memory` | `[what to remember or forget]` | Long-term project memory in `.claude/memory/`, in the format of Claude Code auto memory: the `MEMORY.md` catalog and one file per fact (`feedback`, `project`, `reference`). It goes to git, so the team sees it. The hook loads the skill and the catalog in every session |
| `/craft:grill` | `<idea, plan or change>` | Interview before a plan. Claude finds the facts itself and asks only the decisions, in rounds: each question has 3 to 5 options, one recommended, and the user can write an own answer. An open or vague answer comes back in the next round, so no decision is inferred. After each round, it writes the spec to `.claude/local/grill/<slug>.md` (ignored by git). Before the end, it audits the spec and turns every statement without a user decision or a source into a question. Only the user calls it |
| `/craft:hook` | `<behavior that must not repeat>` | After a correction from you, it judges if the correction becomes a project hook. If it does, it proposes the hook and, with your approval, writes it in TypeScript (`.claude/hooks/`, test with `node:test`, message through the translation file) and wires it in `.claude/settings.json`. It separates the cheap and sure check (`PreToolUse`) from the expensive or judgment check (`Stop`, once at the end). When a hook denies an action, it classifies the finding as a real problem, a false positive with evidence, or a doubt |
| `/craft:audit` | `[folder or package]` | One-shot audit of the whole repo: bug, risk, scale, missing test, speed, and lean code. Each finding has a concrete case, the path, and the smallest fix, in three groups: must fix, should fix, nice to have. The report changes no code |

Plugin commands always carry the prefix, so the hub is `/craft:craft`, not `/craft` alone.

Visual-only work has moved to `/design:style` in the design plugin, which includes Impeccable. Design first prepares a reviewable mockup with applicable screen states and responsive variants, iterates on it and obtains explicit approval before product implementation. Existing approval for the same artifact and scope is reused. With `/design:style` loaded, the `test-first` hook lets UI edits pass. Behavior still follows `/craft:atdd`. There is no longer a `/craft:style` command.

Automated unit, component, integration and E2E tests verify behavior, public semantics and usable interaction, not appearance. `skills/craft/references/clean-tests.md` owns this rule. Appearance and responsive composition are inspected through the design plugin. A separate screenshot comparison suite is created only on an explicit request.

### Layout of the knowledge

The plugin follows progressive disclosure (`SKILLS-ARCHITECTURE.md`). Only five entry skills are visible to Claude: `atdd`, `craft`, `audit`, `hook` and `setup`. `memory` is a command for the user only, because a hook already gives Claude their text. The rules that apply in every session (`ste`, `tool`, `verify`, `challenge`, `state-of-the-art`) live in `rules/`, and a hook injects them. The rest is reference files that an entry skill links. When you already know the principle, ask for it by name ("apply DRY in src/upload.ts"), and Claude reads its reference. `node scripts/skill-budget.ts` prints the skills visible to Claude and the size of their descriptions.

| Group | References and rules |
|---|---|
| SOLID | `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion` |
| Simplicity | `kiss`, `yagni`, `dry` |
| Performance | `performance` (in the refactor, it understands the data, measures, compares forms, and keeps the one that wins with a number) |
| Language | `english-code` (identifiers, comments, and logs in English), `i18n` (user-facing text through the i18n of the stack, and date, number, and currency through `Intl`), `i18n-layout` (room for a longer translation, and logical CSS for RTL) |
| ATDD steps (`skills/atdd/references/`) | `acceptance-criteria` (step 1: an observable `Then` and the test that proves each scenario), `real-world-edges` (step 1: the catalog of edges, such as long text, emoji, timeout, 403 and double submit, also used by `unit-tests`), `filtered-tests` (steps 3 to 7: the filter of each runner, and when the full suite runs: in CI, or locally by Claude, with no question, when the project has tests, no CI and a code change that is not green), `activity` and `activity-format` in `skills/craft/references/` (a big request as a linear list in `.claude/local/activities/<slug>/index.md`, one verified item at a time, held by the `activity-gate` Stop hook; a request with several parts starts here, with or without `/craft:atdd`) |
| Writing | `ste` (replies and texts in the ASD-STE100 standard, in the language of the user. The hook loads it in every session, outside the triage) |
| Posture | `tool` (Claude is the tool of the user: the request is already the permission, and Claude finds a way to fulfill it. The hook loads it in every session, outside the triage) |
| Hooks | `hook-denied` in `skills/hook/references/` (when a project hook denies or reports a finding: a fix, the narrowest exception with evidence, or one question to the user) |
| Research | `verify` (memory is not a source: Claude researches a fact that can change and cites the source), `challenge` (a claim of the user about a fact is wrong until a proof says it is right, and Claude shows the proof), `state-of-the-art` (before an implementation, Claude researches the official best practices and the current recommendation of the community). The hooks load them in every session, outside the triage |
| Clean Code | `naming`, `functions`, `arguments`, `guard-clauses`, `side-effects`, `comments`, `errors` (including the error that the user sees: problem, recovery, and what the user typed is kept) |
| Tests | `clean-tests` (rules for every test and a catalog of the layers), `unit-tests` (unit, component, and integration: the rule and the edge cases, with the classes taken from the real-world edge cases of `atdd`), `e2e-tests` (only the user journey, with the loading, empty, error, and no-permission states when the screen has them, without appearance or field by field, only with the feature ready), `e2e-container` (the E2E runner runs only in the `e2e` service of the compose file, with the official image), `test-ids` (`data-testid` with a business name on every interactive element, and the test finds the element through it) |

When principles conflict (DRY vs KISS, dependency inversion vs YAGNI), the priority order is in `skills/craft/SKILL.md`.

## Hooks

| Rule | When | What it does |
|---|---|---|
| `ste` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the rule `rules/ste.md`: replies and texts in the ASD-STE100 standard (short sentences, active voice, one instruction per sentence, one term per concept). Replies follow the language of the user. In English, the full standard applies. In other languages, the rules that fit any language apply |
| `memory` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the memory rule and the catalog `.claude/memory/MEMORY.md`. A large catalog is cut at a whole line, below the limit of 10,000 characters of the hook context, with a notice to read the rest |
| `codebase-map` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects a map of what already exists: the top-level functions, classes, and exports of each source folder, in at most 2,000 characters. Tests, dependencies, and build output stay out. Shared folders (`lib`, `utils`, `services`) come first |
| `tool` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the rule `rules/tool.md`: Claude is the tool of the user, and the request of the user is already the permission. Claude does not ask "may I?" and does not tell the user to do the work: if a path fails, it finds another. It hands back only what the user alone can do (slash command, interactive login), with the ready command. It asks for approval only for a destructive action outside the request and never bypasses a hook |
| `verify` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the rule `rules/verify.md`: memory is not a source. Claude researches a version, a tag, an API, a flag, or any fact that can change, and cites the source. Without a source, it writes "not verified" |
| `challenge` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the rule `rules/challenge.md`: a claim of the user about a fact is wrong until a proof says it is right. Claude checks it, and if it is wrong, says so and shows the proof. A preference or a decision is not a fact |
| `state-of-the-art` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the rule `rules/state-of-the-art.md`: before an implementation, Claude researches the official best practices and the current recommendation of the community, applies them, and cites the sources |
| `change` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects `rules/change.md`, the rule for each code change (under 1,800 characters): search every caller first, keep the public signature of a function that has callers, never edit an existing test to fit the change, check the inputs that break the rule (zero, empty, negative, the limit, a duplicate, a concurrent call), and test behavior only. A visual-only change, a text, a rename, or a config value gets no test |
| `reminder` | on every prompt (`UserPromptSubmit`) | Injects one line of 200 characters or less: a request to implement, fix, refactor, migrate or write goes to `/craft:craft` first. Before code or config, the official docs and the expert practice, with a native feature or a vetted package first. The memory rule loads only at the start of the session |
| `research-first` | before `Edit`/`Write` on infra and dependency manifests | **Denies** the edit when the session has no research yet (`WebSearch`, `WebFetch`, Context7, the `web-fetch` agent, or a registry command such as `npm view` or `docker manifest inspect`). It acts on a new or rewritten Dockerfile, compose file or CI file, and on an edit that adds a version or tag (`image: postgres:18`, `FROM node:24`, `uses: actions/checkout@v4`, `"vitest": "^3.2.0"`). An edit without a version passes. A missing transcript passes |
| `activity-gate` | at the end of each turn (`Stop`) | Holds the end of the turn while the active activity of the session has an item without evidence. It reads `.claude/local/activities/<slug>/index.md`, never runs a check, and returns the next item with its criterion and command. It releases the turn when every required item is verified (after one reply with the evidence and the line `ACTIVITY COMPLETE`), when you are asked a question, and as **incomplete** (state saved, resumable) when every path is blocked, there is no progress, the stop limit is reached, or the verifier crashed twice. Claude Code itself overrides a Stop hook after 8 blocks in a row without a tool call. Without an activity, it does nothing |
| `memory-outside-project` | before `Edit`/`Write` and `Bash` | **Denies** writes to `~/.claude/projects/*/memory/`, the local auto memory. In the shell, it denies redirection (`>`, `>>`) and `tee` to that path. Reading and deleting local memory pass, so you can move the facts to the project |
| `test-first` | before `Edit`/`Write` on production code | **Denies** a production code edit while no test file was edited in the session: write the failing test first and see it fail. Test files, translation folders (`lang/`, `locales/`, `i18n/`), files that are not code, and a session with `/craft:atdd` or `/design:style` loaded (by Claude or typed by the user) pass. Unlike the old `atdd-first`, a test written first is enough: the skill does not need to load |
| `english-code` | before `Edit`/`Write` on a code file | **Denies** new text with a letter outside ASCII (accent, other alphabet) in an identifier, comment, or string. Translation folders (`lang/`, `locales/`, `i18n/`, `l10n/`, `translations/`), test files, and files that are not code pass. Only the new text is checked, so editing a legacy file does not lock |
| `test-id` | before `Edit`/`Write` on `.vue`, `.jsx`, and `.tsx` | **Denies** new text with an interactive element without `data-testid`: `button`, `a`, `input`, `select`, `textarea`, `form`, and every element with a `click`, `submit`, `change`, or `input` handler. These pass: `<input type="hidden">`, a wrapper that forwards the attributes of the parent (`v-bind="$attrs"`, `{...rest}`), and test files. Only the new text is checked |
| `test-skip` | before `Edit`/`Write` on a test file | **Denies** new text that skips, focuses, or disables a test: `.skip`, `.only`, `.todo`, `xit`, `fit`, `@pytest.mark.skip`, `t.Skip`, `#[ignore]`, `markTestSkipped`, `->skip()`, `@Disabled` |
| `e2e-container` | before `Bash` | **Denies** `playwright test`, `cypress run/open`, and `artisan dusk` outside `docker run`, `docker exec`, and `docker compose run/exec` |
| `filtered-tests` | before `Bash` | **Denies** a test runner without a filter (path, `related`, `--filter`, `--tests`, `-Dtest`, `-k`, `-t`, `-run`). A config value, a redirect or the whole test folder is not a filter. A command that only reads, installs or asks for help (`cat jest.config.js`, `npm install -D vitest`, `--help`) is not a test run. The full suite passes when the push needs it (see `push-gate`), and in a project with 1 to 10 test files in git |
| `push-gate` | before `Bash` | Never asks the user. With no test, with CI (the CI runs the suite), or with no code change since the last green run of the full suite, `git push`, `gh pr create` and `glab mr create` pass. With tests, no CI and a code change that is not green yet, it **denies** them and tells Claude to run the full suite now, then push when it is green |
| `refactor-on-green` | after tests run with output that has a success summary and no failure | Injects a short reminder: when all scenarios are green, load `craft:craft` (step 6 of ATDD). Runner text inside a heredoc or a quoted string does not count, except in `sh -c`. A change of less than 20 code lines, test files included (the diff of the branch from the default branch, plus new files), gets no injection |
