# ATDD

Every behavior change follows these steps, in this order. Never skip or reorder them. Steps 2 to 5 form a loop: **one scenario per turn**.

1. **Specification**: write all acceptance criteria as Given/When/Then scenarios. Go through `real-world-edges.md` and include the edges the feature has. Follow `acceptance-criteria.md`. Show the scenarios to the user and wait for approval. After approval, add one activity item per scenario, plus the refactor and the passing again. The `activity-gate` hook then holds the end of the turn until every item has evidence.
2. **Test**: write the acceptance test for **one** scenario, at the unit or integration layer (`clean-tests.md`). E2E is not part of the loop. Do not write production code yet.
3. **Red**: run **only the new test**. Confirm that it fails **for the expected reason** (missing behavior), not because of a syntax, import or setup error.
4. **Green**: write the minimum production code that makes the test pass. Less code is better than more code: reuse what already exists, and generic code is born reusable (the root rule).
5. **Passing**: run the tests of the scenarios already done. Confirm that they pass. If a scenario remains, go back to step 2 with the next one.
6. **Refactor**: with all scenarios green, improve the code with the screening of the principles in `SKILL.md`. Read only the references of the principles with a sign. The `refactor-on-green` hook injects this triage when the suite turns green. The behavior does not change.
7. **Passing again**: run the tests **of the touched domains**. Confirm that everything still passes. Run them with a filter (`filtered-tests.md`).

## Why one scenario per turn

Batch tests verify an imagined behavior. One scenario per turn keeps each test born from the code that exists, and each green step small.

## Preparatory refactor

If the current code makes the change hard, refactor **before** step 2. First make the change easy, then make the easy change.

- The suite must be green before and after.
- The refactor does not change behavior and follows the screening of the principles.
- The refactor is a structural change. `git:commit` keeps it in its own commit, before the behavior commits.

## Rules

- Never write production code without a failing test that requires it.
- At the end of each step, say which step finished and the result. Example: "Step 3 (Red): 2 failing, `expected 'error' got undefined`".
- If a test fails in step 5 or 7, go back to step 4 or fix the refactor.
- Never disable, skip or delete a test to make the suite pass. The `test-skip` hook denies `.skip`, `.only` and similar.
- Code in English and user text in the translation file: `english-code.md` and `i18n.md`.
- A correction from the user can become a project hook: `craft:hook`.
- A decision made on the way (library, format, business rule) goes to the repo, as `memory.md` says.
- Follow the test runner and the environment of the project (container, `package.json` script, `artisan test`).
- Write the E2E test only when the feature is ready: all its cycles are green and the full flow works on screen. Write one test for each new journey and run it in a container (`e2e-tests.md`, `e2e-container.md`). The `e2e-container` hook denies E2E on the host. An E2E test in the middle of the cycle fails because the screen is incomplete, creates noise and delays delivery.

## When it does not apply

A visual-only change, a text, a rename or a config value gets no test (the engineer rules).

- **Change without behavior** (config, doc, name, pure refactor): skip the loop. Refactor with the screening of the principles, with the suite green before and after.
- **Uncertain specification**: do a spike, code written only to learn. Show the user what you learned. Then delete the spike code and start at step 1. Never reuse spike code in production.
- **External state that you cannot control**: isolate the boundary (`dependency-inversion.md`) and test the rule with a test double. The boundary stays in the integration test.

## Example of step 1

```gherkin
Scenario: attachment above the limit is rejected
  Given an open request
  When the user uploads an attachment of 11 MB
  Then the response is 422
  And the message states the limit of 10 MB
```
