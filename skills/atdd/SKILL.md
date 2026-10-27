---
name: atdd
description: 7-step ATDD flow (Given/When/Then specification, then a loop of test, red, green and passing for each scenario, then refactor and passing again). Use for every feature or bug fix that changes behavior, before you write production code.
argument-hint: "<what must change>"
---

# ATDD

Every behavior change follows these steps, in this order. Never skip or reorder them. Steps 2 to 5 form a loop: **one scenario per turn**.

1. **Specification**: write all acceptance criteria as Given/When/Then scenarios. Go through the [real-world edges](#real-world-edges) and include the ones the feature has. Load the `craft:acceptance-criteria` skill with the `Skill` tool and follow it. Show the scenarios to the user and wait for approval. After approval, follow the `craft:tasks` skill (the hook injects it in every session). It creates the tasks and sets the goal.
2. **Test**: write the acceptance test for **one** scenario, at the unit or integration layer (`craft:clean-tests`). E2E is not part of the loop. Do not write production code yet.
3. **Red**: run **only the new test**. Confirm that it fails **for the expected reason** (missing behavior), not because of a syntax, import or setup error.
4. **Green**: write the minimum production code that makes the test pass. Less code is better than more code: reuse what already exists, and generic code is born reusable (root rule of `craft:craft`).
5. **Passing**: run the tests of the scenarios already done. Confirm that they pass. If a scenario remains, go back to step 2 with the next one.
6. **Refactor**: with all scenarios green, improve the code with the `craft:craft` skill. It triages the principles, including performance, and loads only the ones that apply. The `refactor-on-green` hook injects this triage when the suite turns green. The behavior does not change.
7. **Passing again**: run the tests **of the touched domains**. Confirm that everything still passes. See [filtered execution](#filtered-execution).

## Real-world edges

Code that works only with perfect data breaks in the hands of the user. In step 1, compare each edge in this list with the feature:

| Edge | Example |
|---|---|
| Empty text and very long text | empty name, description with 5,000 characters |
| Emoji and accent | `Zoë 🚀` in the name field |
| Large number | value in the billions |
| Very large list | 10,000 items in the listing |
| Network drops or times out | the API does not answer in 30 s |
| Response 401, 403, 404 and 500 | expired session, item already deleted, server error |
| No permission | user without the editor role opens the edit screen |
| Double submit | two quick clicks on the save button |
| Concurrent operation | two people edit the same item |

- Write one scenario for each edge that the feature has.
- An edge that the feature does not have does not become a scenario. Example: a rule with no network has no timeout edge.
- The edge scenario follows the loop like the others: one per turn.

The `craft:unit-tests` skill uses this same list to find the equivalence classes.

## Why one scenario per turn

Writing all tests first and all code after is "test first", not "test-driven". Batch tests verify an imagined behavior, and the code is born large in one step. With one scenario per turn, each test is born from the code that already exists, and each green step is small.

## Preparatory refactor

If the current code makes the change hard, refactor **before** step 2. First make the change easy, then make the easy change.

- The suite must be green before and after.
- The refactor does not change behavior and follows `craft:craft`.
- The refactor goes in its own commit, before the behavior commits.

## Commits

Never mix a structural change and a behavior change in the same commit. The semantic commit type shows which one it is:

| Change | Type | When |
|---|---|---|
| Structural: the behavior does not change | `refactor`, `perf` | preparatory refactor and step 6 |
| Behavior | `feat`, `fix` | steps 2 to 5 |

Order: the preparatory refactor, then the behavior, then the refactor of step 6.

## Rules

- Never write production code without a failing test that requires it.
- At the end of each step, say which step finished and the result. Example: "Step 3 (Red): 2 failing, `expected 'error' got undefined`".
- If a test fails in step 5 or 7, go back to step 4 or fix the refactor. Never change the test to make it pass, unless the specification changed.
- Never disable, skip or delete a test to make the suite pass. The `test-skip` hook denies `.skip`, `.only` and similar.
- Code is English only, including the test identifiers. The test name and test data can be in the language of the project. Text that the user sees goes in the translation file, in the language of the user, through the i18n of the stack. See `craft:i18n`. The `english-code` hook denies anything that breaks this rule.
- If the user corrects something you did, decide with `craft:hook` whether the correction becomes a project hook.
- Record any decision or choice made on the way (library, format, business rule) in the repo. Use CLAUDE.md for context for the model, `.claude/memory/` for learning from the conversation (`craft:memory`), and `docs/` for the team. Always use a relative path. Never use the local memory of Claude or an absolute path.
- Follow the test runner and the environment of the project (container, `package.json` script, `artisan test`).
- Write the E2E test only when the feature is ready: all its cycles are green and the full flow works on screen. Write one test for each new journey and run it in a container (`craft:e2e-tests`). The `e2e-container` hook denies E2E on the host. An E2E test in the middle of the cycle fails because the screen is incomplete, creates noise and delays delivery.

## Filtered execution

The whole suite grows with the project and starts to cost minutes without telling you more about the change. Run only what the change can break:

| Step | What to run |
|---|---|
| 3 | only the test written in step 2 |
| 5 | the tests of the scenarios already done |
| 6 (between refactors) | the tests of the refactored file or module |
| 7 | the tests of the touched domains: the ones for the changed files (`git diff --name-only main...`) and the ones for the modules that import those files |

Run every test with a filter. The `filtered-tests` hook denies the full suite without the consent of the user.

The full suite runs this way:

- **Project with CI**: the full suite runs in the cloud, after the push. Do not run it locally.
- **Project without CI**: before the push or the PR/MR, ask the user with `AskUserQuestion`. Use the exact options `Run the full suite locally` and `Continue without the full suite`. The `push-gate` hook denies the push and the PR/MR until the user answers. If the answer is to run it, run the suite and push only with it green.

The answer is valid until the next code edit. After an edit, ask again.

When you report, state the filter used. Example: "Step 7 (Passing again): 34 passing in `tests/Feature/Request` and `tests/Unit/Attachment`".

Filters by runner:

| Runner | Filter |
|---|---|
| vitest | `vitest related <changed files> --run`, or `vitest run <folder>` |
| jest | `jest --findRelatedTests <changed files>`, or `jest <folder>` |
| pest / `artisan test` | `artisan test tests/Feature/<Domain>`, `--filter <name>` |
| phpunit | `phpunit tests/Unit/<Domain>`, `--filter <name>` |
| pytest | `pytest tests/<domain>`, `-k <name>` |
| `node --test` | `node --test <test files>`, `--test-name-pattern <name>` |
| go | `go test ./<package>/...`, `-run <name>` |
| cargo | `cargo test <name>`, `-p <crate>` |

## When it does not apply

- **Change without behavior** (config, doc, name, pure refactor): skip the loop. Refactor with `craft:craft`, with the suite green before and after.
- **Uncertain specification**: do a spike, code written only to learn. Show the user what you learned. Then delete the spike code and start at step 1. Never reuse spike code in production.
- **Visual change that a code test does not verify** (layout, animation): verify with a screenshot and write the test only for the behavior. If the change is only visual, use `craft:style`.
- **External state that you cannot control**: isolate the boundary (`craft:dependency-inversion`) and test the rule with a test double. The boundary stays in the integration test.

## Example of step 1

```gherkin
Scenario: attachment above the limit is rejected
  Given an open request
  When the user uploads an attachment of 11 MB
  Then the response is 422
  And the message states the limit of 10 MB
```
