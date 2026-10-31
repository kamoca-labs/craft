# Plugin `craft`

## Contents

- [Installation](#installation)
- [Overview](#overview)
- [Commands](#commands)
- [Hooks](#hooks)
- [Use cases](USAGE.md)

## Installation

```bash
claude plugin marketplace add kamoca-labs/marketplace
claude plugin install craft@kamoca
```

The plugin needs Node 22.18 or later. The commands appear in the next session. The update steps are in the [marketplace README](https://github.com/kamoca-labs/marketplace#installation).

## Overview

Good programming practices for any project: the **ATDD** flow in 7 steps and the **principle-guided refactor** (SOLID, KISS, YAGNI, DRY, Clean Code).

One rule is the root of everything: **less code is better than more code**. It is not a skill of its own. It is what `kiss` (reuse before you write), `yagni` (write only what a current use needs), and `dry` (generic code is born reusable) have in common. `/craft:craft` and step 4 of `/craft:atdd` enforce this rule.

Each principle is a skill of its own, with a rule, a reason, violation signals, how to apply it, a before/after example, limits, and a check question. You do not load them one by one. `/craft:craft` triages the code and loads only the skills that have a signal. A hook starts this triage by itself right after the suite turns green.

## Commands

| Command | Arguments | What it does |
|---|---|---|
| `/craft:craft` | `[file or scope]` | Enforces the root rule (less code is better than more code) and triages the code against all principles. It loads and applies only the skills with a signal, and at the end runs the tests of the touched domains. The check has one triage round, one batch of fixes, and at most one confirmation round. When the change alters the UI, it suggests `/impeccable audit` or `/impeccable harden` and does not run them |
| `/craft:setup` | `[stack]` | Prepares the project: test runner and linter with limits for function (20 lines), file (200), parameters (3), nesting (2), and complexity (10). `/craft:craft` then runs this lint in the triage |
| `/craft:atdd` | `<what must change>` | Runs the 7 steps: Given/When/Then specification (with the list of real-world edge cases: long text, emoji, timeout, 403, double submit), a loop of test, red, green, and passing per scenario, refactor (through `/craft:craft`), and passing again. Each acceptance criterion names an observable value and the test that proves it. After the user approves the specification, it splits the work into tasks (`TaskCreate`, one per scenario) and sets a goal: a Stop hook holds the end of the turn until the condition is true. It accepts a preparatory refactor before the loop, in its own commit |
| `/craft:style` | `<what must change on the screen>` | Style mode for a visual-only change: it loads impeccable, iterates on the screen with you without a specification or a red test, and at the end runs the filtered tests of the touched files. Behavior goes to `/craft:atdd`. For a mixed feature, it asks for the order (back end first, screen first, or by slice). It fixes the motion rules: nothing appears or disappears suddenly |
| `/craft:memory` | `[what to remember or forget]` | Long-term project memory in `.claude/memory/`, in the format of Claude Code auto memory: the `MEMORY.md` catalog and one file per fact (`feedback`, `project`, `reference`). It goes to git, so the team sees it. The hook loads the skill and the catalog in every session |
| `/craft:tasks` | `[what to do]` | Splits the request into activities with `TaskCreate` and sets the goal: a `META:` task with the verification command, closed with `META CLOSED:`. The `tasks` hook already loads the skill in every session, so the command only forces it for one request |
| `/craft:hook` | `<behavior that must not repeat>` | After a correction from you, it judges if the correction becomes a project hook. If it does, it proposes the hook and, with your approval, writes it in TypeScript (`.claude/hooks/`, test with `node:test`, message through the translation file) and wires it in `.claude/settings.json`. It separates the cheap and sure check (`PreToolUse`) from the expensive or judgment check (`Stop`, once at the end). When a hook denies an action, it classifies the finding as a real problem, a false positive with evidence, or a doubt |

Plugin commands always carry the prefix, so the hub is `/craft:craft`, not `/craft` alone.

### One skill per principle

These skills stay out of the `/` menu (`user-invocable: false`). The entry point is `/craft:craft`, which loads only the skills that have a signal. When you already know the principle, ask for it by name ("apply DRY in src/upload.ts"), and Claude loads its skill.

| Group | Skills |
|---|---|
| SOLID | `single-responsibility`, `open-closed`, `liskov-substitution`, `interface-segregation`, `dependency-inversion` |
| Simplicity | `kiss`, `yagni`, `dry` |
| Performance | `performance` (in the refactor, it understands the data, measures, compares forms, and keeps the one that wins with a number) |
| Language | `i18n` (code in English, user-facing text through the i18n of the stack, date, number, and currency through `Intl`, room for translation, and logical CSS for RTL) |
| ATDD steps | `acceptance-criteria` (step 1: an observable `Then` and the test that proves each scenario), `tasks` (also as `/craft:tasks [what to do]`. It splits the request into activities. In ATDD, after the user approves the specification, it creates the tasks with `TaskCreate`. It finds the goal criterion by itself (scenarios, request, or project scripts) and sets the goal whenever a criterion exists and the tool exists: a `META:` task opened before the first step and closed with `META CLOSED:`, plus a Stop hook. Without the tool, it asks the user to enable it and uses the list in the reply. The `tasks` hook injects the skill in every session, so it works without `/craft:atdd`) |
| Writing | `ste` (replies and texts in the ASD-STE100 standard, in the language of the user. The hook loads it in every session, outside the triage) |
| Posture | `tool` (Claude is the tool of the user: the request is already the permission, and Claude finds a way to fulfill it. The hook loads it in every session, outside the triage) |
| Research | `verify` (memory is not a source: Claude researches a fact that can change and cites the source), `challenge` (a claim of the user about a fact is wrong until a proof says it is right, and Claude shows the proof), `state-of-the-art` (before an implementation, Claude researches the official best practices and the current recommendation of the community). The hooks load them in every session, outside the triage |
| Clean Code | `naming`, `functions`, `arguments`, `guard-clauses`, `side-effects`, `comments`, `errors` (including the error that the user sees: problem, recovery, and what the user typed is kept) |
| Tests | `clean-tests` (rules for every test and a catalog of the layers), `unit-tests` (unit, component, and integration: the rule and the edge cases, with the classes taken from the real-world edge cases of `atdd`), `e2e-tests` (only the user journey, with the loading, empty, error, and no-permission states when the screen has them, without style, `hover`, or field by field, only with the feature ready and only in a container), `test-ids` (`data-testid` with a business name on every interactive element, and the test finds the element through it) |

When principles conflict (DRY vs KISS, dependency inversion vs YAGNI), the priority order is in `skills/craft/SKILL.md`.

## Hooks

| Rule | When | What it does |
|---|---|---|
| `ste` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:ste`: replies and texts in the ASD-STE100 standard (short sentences, active voice, one instruction per sentence, one term per concept). Replies follow the language of the user. In English, the full standard applies. In other languages, the rules that fit any language apply |
| `memory` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:memory` and the catalog `.claude/memory/MEMORY.md`. A large catalog is cut at a whole line, below the limit of 10,000 characters of the hook context, with a notice to read the rest |
| `tasks` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:tasks`: tasks per activity (`TaskCreate`) and the `META:` goal, always set when the tool exists |
| `tool` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:tool`: Claude is the tool of the user, and the request of the user is already the permission. Claude does not ask "may I?" and does not tell the user to do the work: if a path fails, it finds another. It hands back only what the user alone can do (slash command, interactive login), with the ready command. It asks for approval only for a destructive action outside the request and never bypasses a hook |
| `verify` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:verify`: memory is not a source. Claude researches a version, a tag, an API, a flag, or any fact that can change, and cites the source. Without a source, it writes "not verified" |
| `challenge` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:challenge`: a claim of the user about a fact is wrong until a proof says it is right. Claude checks it, and if it is wrong, says so and shows the proof. A preference or a decision is not a fact |
| `state-of-the-art` | at the start, on resume, on `/clear`, and after the compaction of the session | Injects the skill `craft:state-of-the-art`: before an implementation, Claude researches the official best practices and the current recommendation of the community, applies them, and cites the sources |
| `meta-goal` | at the end of each turn (`Stop`) | **Blocks** the end of the turn while the declared goal is not closed: without the verification command, with success, after the last code edit, or without the `META CLOSED:` line. It releases the turn when the reply asks the user something and at the block limit. It is a script, without an agent, so it uses no tokens. Without a declared goal, it does nothing |
| `memory-outside-project` | before `Edit`/`Write` and `Bash` | **Denies** writes to `~/.claude/projects/*/memory/`, the local auto memory. In the shell, it denies redirection (`>`, `>>`) and `tee` to that path. Reading and deleting local memory pass, so you can move the facts to the project |
| `atdd-first` | before `Edit`/`Write` on a code file | **Denies** the edit if `craft:atdd` was not loaded in the session. A file that is not code (`.md`, `.json`, `.yml`, `.env`) passes. With `craft:style` loaded, a UI component (`.vue`, `.tsx`, `.jsx`, `.svelte`, `.astro`) passes, and the rest of the code stays denied |
| `english-code` | before `Edit`/`Write` on a code file | **Denies** new text with a letter outside ASCII (accent, other alphabet) in an identifier, comment, or string. Translation folders (`lang/`, `locales/`, `i18n/`, `l10n/`, `translations/`), test files, and files that are not code pass. Only the new text is checked, so editing a legacy file does not lock |
| `test-id` | before `Edit`/`Write` on `.vue`, `.jsx`, and `.tsx` | **Denies** new text with an interactive element without `data-testid`: `button`, `a`, `input`, `select`, `textarea`, `form`, and every element with a `click`, `submit`, `change`, or `input` handler. These pass: `<input type="hidden">`, a wrapper that forwards the attributes of the parent (`v-bind="$attrs"`, `{...rest}`), and test files. Only the new text is checked |
| `test-skip` | before `Edit`/`Write` on a test file | **Denies** new text that skips, focuses, or disables a test: `.skip`, `.only`, `.todo`, `xit`, `fit`, `@pytest.mark.skip`, `t.Skip`, `#[ignore]`, `markTestSkipped`, `->skip()`, `@Disabled` |
| `e2e-container` | before `Bash` | **Denies** `playwright test`, `cypress run/open`, and `artisan dusk` outside `docker run`, `docker exec`, and `docker compose run/exec` |
| `filtered-tests` | before `Bash` | **Denies** a test runner without a filter (path, `related`, `--filter`, `-k`, `-t`, `-run`). The full suite passes only with the answer `Run the full suite locally` in `AskUserQuestion`, given after the last code edit |
| `push-gate` | before `Bash` | In a project without CI, **denies** `git push`, `gh pr create`, and `glab mr create` until the user answers in `AskUserQuestion` if the full suite runs locally. With CI (`.github/workflows/`, `.gitlab-ci.yml`, and similar), it passes |
| `refactor-on-green` | after tests run with output that has no failure | Injects the triage of `craft:craft` (step 6 of ATDD) |
