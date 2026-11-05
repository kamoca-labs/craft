# Changelog

Notes reconstructed from repository commits and manifest versions. Historical dates identify version changes in Git, not previously published releases. Versions absent from the recorded history are not invented. Categories without changes are omitted.

## 0.17.0 (2026-11-05)

### Breaking changes

- Only five skills are visible to Claude: `atdd`, `craft`, `audit`, `hook` and `setup`. The listing of craft drops from 40 descriptions (10,548 characters) to 5 (1,296 characters), as `SKILLS-ARCHITECTURE.md` plans. `node scripts/skill-budget.ts` prints the count.
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
