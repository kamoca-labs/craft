# Craft audit — 2026-11-05

## Scope and work in progress

The current branch is `feat/tasks-reminder`. Recent commits moved the skills to progressive disclosure, restored the session safety rules, added the test-first edit gate, and made the refactor reminder count committed branch changes.

This review covers the hook configuration, transcript and command parsing, enforcement rules, tests, and skill structure. Benchmarks are excluded at the user's request. The existing untracked benchmark result is preserved.

## Findings and corrections

| Priority | Finding | Correction |
|---|---|---|
| P1 | A denied test edit counted as a written test and released production edits. | `test-first` ignores tool calls with an error result. |
| P1 | A failed ATDD or style skill invocation released production edits. | Failed skill calls no longer count as loaded flows. |
| P1 | A flow name in ordinary user text or a tool result counted as a loaded skill. | Recognize assistant `Skill` calls and user slash-command messages, rather than searching serialized transcript entries. |
| P1 | One malformed JSONL line discarded the entire transcript, making the test-first gate allow the edit. | Parse each line separately and retain the valid entries. |
| P1 | A filtered test followed by an unfiltered suite in the same shell command bypassed the suite gate. | Check all recognized test invocations across shell command segments. |
| P2 | A pending verification call with no result counted as success. | The goal hook requires a corresponding successful tool result. |
| P2 | An `echo` containing the verification command counted as running it. | Match the declared command or a shell command segment, rather than an arbitrary substring. |

## Validation

- The original hook suite passed all 147 tests.
- Seven new regression tests failed before the corrections and passed afterward.
- The complete hook suite passes all 154 tests, including the structure checks.
- `node scripts/skill-budget.ts` reports 5 visible skills and 1,317 description characters.
- `git diff --check` passes.

## Limits

The shell checks remain heuristics for the recognized commands, not a full shell interpreter. The test-first rule checks session history; it does not prove that a particular test covers the production edit or that the test ran red. An unavailable transcript still allows the edit, as the existing hook contract requires. Goal verification relies on tool result error flags and does not independently evaluate test output. No benchmark or live model session was run.
