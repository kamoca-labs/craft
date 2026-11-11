# Changelog

Notes reconstructed from repository commits and manifest versions. Historical dates identify version changes in Git, not previously published releases. Versions absent from the recorded history are not invented. Categories without changes are omitted.

## 1.0.0 (2026-11-11)

craft is now an opt-in engineer toolkit. Nothing loads in a session until the user calls a craft skill.

### Added

- `/craft:plan <scope>`: closes every gap of a large scope before the work. Claude (the Elephant, on Sonnet for the first turn) finds the facts and asks only the decisions, in rounds of 3 to 5 options, and records them in `.claude/local/plans/<slug>.md`. Then it writes the linear activity.
- The `goldfish` agent (Haiku, the `Read` tool only, a fresh context) reads the activity and the files that its pending items name, and lists each point where an executor must guess. Each gap becomes a question. The loop stops at no gap or after 3 rounds. The pattern comes from the Google Elephant-Goldfish model. Only `craft:plan` uses it.
- `/craft:doc [section or package]`: writes `ARCHITECTURE.md` in the arc42 structure (12 sections). Claude finds the facts in the repo and asks only the decisions, one section at a time, and marks a section open with `<!-- arc42:todo -->` until it is complete. It detects the language of the project and the layout (root or monorepo), and adapts the document to both. It changes no code.

### Changed

- Every skill uses `disable-model-invocation: true`: only the user starts craft, and no skill description goes into the session context.
- `/craft:craft <activity>` executes an activity one verified item at a time. Without an activity, it suggests `/craft:plan` once. If the user goes on, it builds a one-item activity.
- No hook injects text at the start of a session or on a prompt. The rules `change`, `tool`, `verify`, `challenge` and `state-of-the-art` are now `skills/craft/references/engineer.md`. `ste` and `memory` are references too. `craft:craft` and `craft:plan` read them when the user calls them. `codebase-map` is `scripts/codebase-map.ts`.
- The deny hooks and `refactor-on-green` act only while a craft activity is active in the session. Outside an activity, they allow every action.
- `/craft:setup` no longer writes the ATDD line in the `CLAUDE.md` of the project.
- The `bench/` run is no longer required before a change to the text of a session.

### Removed

- `/craft:atdd`: ATDD is now `skills/craft/references/atdd.md`, with its references in `skills/craft/references/`. Use `/craft:craft`.
- `/craft:grill`: replaced by `/craft:plan`. The round format and the spec format moved to `skills/plan/references/`.
- The `reminder` hook (on every prompt) and the SessionStart hooks `ste`, `memory`, `codebase-map`, `change`, `tool`, `verify`, `challenge` and `state-of-the-art`. The folder `rules/` is gone.

## 0.19.1 (2026-11-11)

### Fixed

- `filtered-tests` denied every full run of the suite, even when the push needed it. At PreToolUse the transcript already holds the pending Bash call with no result, and the green-run check counted that call as a green full run. A run now counts as green only when its result exists and is not an error.

## 0.19.0 (2026-11-11)

### Changed

- The push no longer asks the user about the full suite. `push-gate` and `filtered-tests` decide from the project:
  - No test, or a CI that runs the suite, or no code change since the last green run of the full suite: nothing runs locally and nothing is asked. A local run would repeat the CI or prove nothing new.
  - Tests, no CI, and a code change that is not green yet: Claude runs the full suite now, and pushes only when it is green.
- "Code changed" is read from the commits that the push would send (against the upstream branch or `origin/main`) and from the last code edit of the session.
- The answers `Run the full suite locally` and `Continue without the full suite` are gone.

## 0.18.0 (2026-11-11)

### Breaking changes

- `/craft:tasks`, the `tasks` SessionStart hook, the `meta-goal` Stop hook and the `META:` task are removed. `TaskCreate` is no longer part of the flow. Use `/craft:craft` for a big or multi-step request.
- A `META:` declaration in a session that is already running is no longer enforced.

### Added

- Activity: a linear, numbered list in `.claude/local/activities/<slug>/index.md` (ignored by git), with a child file and folder for a complex item. `craft:craft` builds it (`references/activity.md`, `references/activity-format.md`).
- `scripts/activity.ts`: the CLI (`start`, `status`, `begin`, `done`, `verify`, `approve`, `block`, `replan`, `split`, `resume`, `link`, `export`, `goal-line`).
- `activity-gate` Stop hook: the next item, one at a time, until every required item has sealed evidence; or an incomplete end with a saved state.
- Evidence with files: a check writes to `$ACTIVITY_EVIDENCE_DIR`, or `approve --attach` adds files. They are sealed and shown in `index.md` (images inline).
- `reopen`: the user rejects a verified item, and it returns as the next item with its dependents. A `review` check is approved by Claude with a note.
- Short CLI output (one line per command, `show` for the whole file) and a plan with `check` as a command string: fewer tokens per activity.

### Decisions and limits

- The markdown is the only source. A seal (HMAC with `.claude/local/.seal`) separates evidence from a box checked by hand. It guards against mistakes, not against someone who reads the key.
- Jira and Asana: no integration exists, so `export` is a dry run. Publishing needs an explicit request.
- `TaskCompleted` is not used, because the native tasks are not part of the flow.
- `/goal` cannot be run by a skill or a hook, so there is no binding. The hook prints the line `ACTIVITY COMPLETE` that its evaluator can read, and `goal-line` gives the condition.
- The `bench/` benchmark was not run for this change. `bench/run.ts` still allows the task tools in its sessions.

## 0.17.0 (2026-11-05)

### Breaking changes

- Only five skills are visible to Claude: `atdd`, `craft`, `audit`, `hook` and `setup`. The listing of craft drops from 40 descriptions (10,548 characters) to 5 (1,317 characters). `node scripts/skill-budget.ts` prints the count.
- The principles and the step guides are reference files. Claude reads them with `Read`, so `craft:<name>` no longer loads with the `Skill` tool:
  - `craft:acceptance-criteria` → `skills/atdd/references/acceptance-criteria.md`
  - `craft:e2e-container` → `skills/atdd/references/e2e-container.md`
  - `craft:filtered-tests` → `skills/atdd/references/filtered-tests.md`
  - `craft:real-world-edges` → `skills/atdd/references/real-world-edges.md`
  - `craft:arguments` → `skills/craft/references/arguments.md`
  - `craft:clean-tests` → `skills/craft/references/clean-tests.md`
  - `craft:comments` → `skills/craft/references/comments.md`
  - `craft:dependency-inversion` → `skills/craft/references/dependency-inversion.md`
  - `craft:dry` → `skills/craft/references/dry.md`
  - `craft:e2e-tests` → `skills/craft/references/e2e-tests.md`
  - `craft:english-code` → `skills/craft/references/english-code.md`
  - `craft:errors` → `skills/craft/references/errors.md`
  - `craft:functions` → `skills/craft/references/functions.md`
  - `craft:guard-clauses` → `skills/craft/references/guard-clauses.md`
  - `craft:i18n-layout` → `skills/craft/references/i18n-layout.md`
  - `craft:i18n` → `skills/craft/references/i18n.md`
  - `craft:interface-segregation` → `skills/craft/references/interface-segregation.md`
  - `craft:kiss` → `skills/craft/references/kiss.md`
  - `craft:liskov-substitution` → `skills/craft/references/liskov-substitution.md`
  - `craft:naming` → `skills/craft/references/naming.md`
  - `craft:open-closed` → `skills/craft/references/open-closed.md`
  - `craft:performance` → `skills/craft/references/performance.md`
  - `craft:side-effects` → `skills/craft/references/side-effects.md`
  - `craft:single-responsibility` → `skills/craft/references/single-responsibility.md`
  - `craft:test-ids` → `skills/craft/references/test-ids.md`
  - `craft:unit-tests` → `skills/craft/references/unit-tests.md`
  - `craft:yagni` → `skills/craft/references/yagni.md`
  - `craft:hook-denied` → `skills/hook/references/hook-denied.md`
- The rules that load in every session are files that a hook injects. They are no longer skills:
  - `craft:challenge` → `rules/challenge.md`
  - `craft:state-of-the-art` → `rules/state-of-the-art.md`
  - `craft:ste` → `rules/ste.md`
  - `craft:tool` → `rules/tool.md`
  - `craft:verify` → `rules/verify.md`
- `/craft:memory` and `/craft:tasks` are commands for the user only (`disable-model-invocation: true`). The hooks still inject their rules in every session.
- The `atdd-first` hook is gone. The `test-first` hook takes its place.

### Improvements

- The SessionStart rules are short, about 7,200 characters instead of 17,300. The full ASD-STE100 text is in `rules/ste-standard.md`.
- A new `change` rule asks Claude to search every caller, keep the public signature, keep the existing tests, check the inputs that break the rule, and test behavior only. A visual-only change gets no test.
- One `reminder` hook replaces `tasks-reminder`, `research-reminder` and `memory-reminder`, with one line of 200 characters or less.
- A project with 1 to 10 test files can run its full suite.
- A request with one action gets no task and no goal, except the ATDD flow.
- A `test-first` hook denies a production code edit while no test file was edited in the session. It replaces `atdd-first`, which also required loading `/craft:atdd`.
- The refactor triage enters only for a change of 20 code lines or more.
- The memory rule forbids secrets, credentials and personal data again.

### Fixes

- Keep valid transcript entries when a JSONL line is incomplete or malformed.
- Do not count denied test edits, failed skill calls, or flow names quoted in ordinary text as test-first prerequisites.
- Check every recognized test invocation in a compound command before allowing an unfiltered suite.
- Require a successful verification result for the goal reminder, and do not count an `echo` of the verification command as execution.
- Record the scope, findings, regression checks, and limits in the body of the commit `e63ec75`.

## 0.16.1 (2026-11-04)

### Improvements

- The commit policy (a structural change and a behavior change never share a commit) moves from `/craft:atdd` to `/git:commit` 0.8.0. The preparatory refactor in `/craft:atdd` points to `/git:commit`.

## 0.16.0 — 2026-11-02

### Breaking changes

- Visual-only work moves from `/craft:style` to `/design:style`. Install the design plugin; the old command no longer unlocks UI edits. Behavior changes still require `/craft:atdd`.

### Improvements

- The component gate recognizes the design style flow while retaining the behavior/backend boundary, including formatted tool calls and direct command invocation.
- Visual triage points to `/design:review` rather than a separate Impeccable installation.
- Functional unit, component, integration and E2E guidance excludes decorative color, exact geometry, CSS-class and animation assertions. Behavior, accessible semantics and functional visibility remain testable.
- Usage guidance explains responsive mockups, alternate states and explicit approval before visual implementation.

Evidence: [migration](https://github.com/kamoca-labs/craft/commit/2a75f3a), [test guidance](https://github.com/kamoca-labs/craft/commit/eeef57c), [version](https://github.com/kamoca-labs/craft/commit/19c73bb).

## 0.15.0 — 2026-10-30

### New features

- Three session-start research skills verify changeable facts, examine factual claims and research current implementation practices before acting.

### Improvements

- Document `/craft:tasks` as a public command.
- Distribute standalone English-language skills, documentation and hook messages while keeping replies in the user's language.
- Add a plugin icon and MIT licensing information.

Evidence: [research skills](https://github.com/kamoca-labs/craft/commit/c615c91), [standalone documentation](https://github.com/kamoca-labs/craft/commit/459d0c7), [packaging](https://github.com/kamoca-labs/craft/commit/d7aecd1).

## 0.14.1 — 2026-10-26

### Fixes

- Correct the tool guidance so the agent tries available alternatives and performs authorized work instead of handing routine setup back to the user. Reserve handoff for actions such as interactive login.

Evidence: [fix](https://github.com/kamoca-labs/craft/commit/b17585f).

## 0.14.0 — 2026-10-26

### New features

- Load the user-tool rule at session start so an existing request authorizes routine work within its scope.

Evidence: [session rule](https://github.com/kamoca-labs/craft/commit/cb12830).

## 0.13.0 — 2026-10-26

### New features

- Load task planning at session start and expose `/craft:tasks` independently of the ATDD flow.

### Improvements

- Replace the agent-based goal check with a transcript-reading Stop script and infer a verifiable goal from the request, scenarios or project scripts.

Evidence: [tasks and goal check](https://github.com/kamoca-labs/craft/commit/0db433e).

## 0.12.0 — 2026-10-20

### New features

- Define acceptance criteria with observable outcomes and a test that proves each scenario.
- Create scenario-level tasks after specification approval and track a session goal through the Stop hook.

Evidence: [acceptance criteria](https://github.com/kamoca-labs/craft/commit/a85a022), [tasks](https://github.com/kamoca-labs/craft/commit/9fe63f5).

## 0.11.0 — 2026-10-20

### New features

- Introduce the original `/craft:style` workflow for visual-only iteration without a prior red behavioral test, with filtered regression checks at completion.
- Allow Vue, TSX, JSX, Svelte and Astro component edits through the visual workflow while retaining ATDD for backend changes.

Migration: this command is replaced by `/design:style` in 0.16.0.

Evidence: [style workflow](https://github.com/kamoca-labs/craft/commit/e11284a), [component gate](https://github.com/kamoca-labs/craft/commit/03aa171).

## 0.10.0 — 2026-10-20

### New features

- Assess real-world input, network and access edge cases when writing scenarios.
- Cover locale-aware dates/numbers/currency, text expansion and logical CSS in i18n guidance.
- Include user-facing errors, retained input and recovery actions in error handling.
- Cover applicable loading, empty, error and permission states in E2E journeys.
- Suggest a design review when UI changes are detected.

### Improvements

- Classify hook denials as real problems, evidence-backed false positives or unresolved questions; distinguish immediate mechanical checks from end-of-session judgment checks.
- Limit refactor verification to a screening, a fix batch and at most one confirmation pass.

Evidence: [edge cases](https://github.com/kamoca-labs/craft/commit/b7bc54d), [i18n](https://github.com/kamoca-labs/craft/commit/bf0201e), [errors](https://github.com/kamoca-labs/craft/commit/6a0e1b0), [screen states](https://github.com/kamoca-labs/craft/commit/5f4692c), [bounded review](https://github.com/kamoca-labs/craft/commit/8dd9c69).

## 0.9.0 — 2026-10-18

### New features

- Separate unit/integration, E2E and test-ID guidance; require a stable `data-testid` contract on interactive components.
- Run the ATDD red/green loop one scenario at a time and compare measured alternatives for performance changes.
- Guard skipped/focused tests, E2E runs outside containers, unfiltered test runs and pushes without the required local-suite decision when CI is absent.

### Fixes

- Detect failures in the default Node test reporter, preventing refactor-on-green from running after a failed suite.

Evidence: [reporter fix](https://github.com/kamoca-labs/craft/commit/edac1e0), [test layers](https://github.com/kamoca-labs/craft/commit/32895f9), [scenario loop](https://github.com/kamoca-labs/craft/commit/ba0d73d), [test guards](https://github.com/kamoca-labs/craft/commit/3d944b1).

## 0.8.0 — 2026-10-15

### New features

- Store shared long-term memory in `.claude/memory/` inside the repository, with a catalog and separate facts.
- Load the memory catalog each session and block writes to machine-local project memory.

Evidence: [project memory](https://github.com/kamoca-labs/craft/commit/f0f6aa7).

## 0.7.0 — 2026-10-15

### Improvements

- Make less code the root rule of implementation and refactoring: reuse existing code, delete unnecessary concepts and extract shared knowledge deliberately.

Evidence: [root rule](https://github.com/kamoca-labs/craft/commit/062ebae).

## 0.6.0 — 2026-10-11

### Breaking changes

- Remove the project-specific `legado` workflow from the general plugin.

### New features

- Block code edits until the ATDD flow is loaded.
- Require English production code and localized user text, with language flexibility for test names and data.
- Turn suitable repeated corrections into tested project hooks.
- Load simplified writing guidance at session start.

### Improvements

- Hide principle sub-skills from the slash menu while retaining automatic loading by the hub.
- Keep project decisions in repository files with relative paths.

Evidence: [removal](https://github.com/kamoca-labs/craft/commit/26f4136), [ATDD gate](https://github.com/kamoca-labs/craft/commit/bbeaba5), [i18n rule](https://github.com/kamoca-labs/craft/commit/6682aa6), [project hooks](https://github.com/kamoca-labs/craft/commit/6327582), [writing](https://github.com/kamoca-labs/craft/commit/fcbdea4).

## 0.1.1 — 2026-10-06

### Improvements

- Remove forge-specific assumptions from general examples and adopt the kamoca marketplace identity. Older `@kauan` installations need migration to `@kamoca`.

Evidence: [forge-neutral examples](https://github.com/kamoca-labs/craft/commit/d80afce), [marketplace identity](https://github.com/kamoca-labs/craft/commit/4b1fbe4).

## 0.1.0 — 2026-10-06

### New features

- Introduce the principle-guided refactor hub with SOLID, KISS, YAGNI, DRY and Clean Code sub-skills.
- Add the seven-step ATDD workflow, filtered checks and automatic refactor triage after green tests.
- Add project setup for tests and lint size/complexity limits.
- Introduce the historical legacy-system workflow, later removed in 0.6.0.

Evidence: [initial plugin](https://github.com/kamoca-labs/craft/commit/865c325), [setup](https://github.com/kamoca-labs/craft/commit/3cb3822), [legacy workflow](https://github.com/kamoca-labs/craft/commit/a380181).
