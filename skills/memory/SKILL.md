---
name: memory
description: Long-term project memory in `.claude/memory/`, inside the repo. The memory hook injects the same rule and the catalog in every session, so only the user calls it, with /craft:memory, to remember or forget something.
argument-hint: "[what to remember or forget]"
disable-model-invocation: true
---

# Project memory

Memory belongs to the project, in `.claude/memory/` inside the repo. Never write it to `~/.claude/projects/` (a hook denies it).

- Before you act, read the memory file of a catalog line that touches the subject.
- Save only a user correction, a confirmed approach, or a decision that the code and git do not show. One file per fact: `.claude/memory/<type>_<subject>.md` with `name`, `description` and `type` (`feedback`, `project`, `reference`), plus `**Why:**` and `**How to apply:**`.
- Add one line to `MEMORY.md`: `- [Title](<file>.md): <hook>`. Update a memory that already covers the fact. Delete a wrong one.
