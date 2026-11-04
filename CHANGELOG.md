# Changelog

Notes reconstructed from repository commits and manifest versions. Historical dates identify version changes in Git, not previously published releases. Versions absent from the recorded history are not invented. Categories without changes are omitted.

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
