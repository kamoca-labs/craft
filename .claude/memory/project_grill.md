---
name: grill
description: craft 0.20.0 adds /craft:grill, a user-only interview that writes the spec to .claude/local/grill
type: project
---

`/craft:grill` (2026-11-11) ports the `grilling` skill of mattpocock/skills (commit `4ae2317`), with the user's changes: each question has 3 to 5 options plus an own answer, the user answers the whole round in one reply, and the spec goes to `.claude/local/grill/<slug>.md`, named after the subject.

**Why:** the user wants no decision inferred by the model. The original lets one "yes" accept every recommendation and keeps no record. The port adds the spec file, re-asks open or vague answers, and a final audit that turns every statement without a user decision or a source into a question.

**How to apply:** keep `grill` with `disable-model-invocation: true` (it is in `USER_ONLY` of the structure test). The user chose the plain flag, not the wrapper and engine pattern of the original, so `craft:atdd` cannot call it. The spec is local to the machine (ignored by git), by the user's choice.
