---
name: push-gate-by-changes
description: craft 0.19.0 stops asking about the full suite before a push. The decision comes from CI, tests and code changes.
type: project
---

Before a push, a PR or an MR, Claude no longer asks the user if the full suite runs locally.

**Why:** the user decided on 2026-11-11 that the question wastes time. With a CI the suite runs anyway, so a local run repeats the work. With no code change since the last green run, a run proves nothing.

**How to apply:**
- No test: push. CI exists: do not run, do not ask. No code change since the last green run of the full suite: do not run, do not ask.
- Tests, no CI, and a code change that is not green: run the full suite now, without asking, and push when it is green.
- The code lives in `hooks/lib.ts` (`suiteRequired`), used by `push-gate` and `filtered-tests`. The text for people is in `skills/craft/references/filtered-tests.md`.
