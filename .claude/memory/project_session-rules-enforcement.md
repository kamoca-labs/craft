---
name: session-rules-enforcement
description: The user considers tasks, memory and state-of-the-art essential, but the model treats the SessionStart injection as optional; the next work adds hooks that enforce them and a craft:code skill.
type: project
---

On 2026-11-04 the user compared craft with ponytail and decided:

- tasks, memory and state-of-the-art are essential. The SessionStart injection alone is not enough: the model skips them. Example: a request with two checks got no tasks until the end of the turn.
- A `craft:code` skill must load the code rules (root rule plus one line per principle) whenever Claude works on code, not only in the refactor.
- The work goes step by step, one PR/MR per demand. The split of skills by single responsibility (atdd, tasks, hook, i18n, e2e-tests) comes after.

**Why:** a rule that the model reads once at the session start loses weight. A hook that checks the transcript does not depend on the model to remember.
**How to apply:** superseded on 2026-11-11 by `project_skills-cost.md`: craft is opt-in, no hook injects text at SessionStart or on a prompt, and the rules are references that `/craft:craft` reads. Enforcement hooks (PreToolUse, Stop) stay.
