---
name: memory
description: Long-term project memory in `.claude/memory/`, inside the repo. The memory hook injects the same rule and the catalog in every session, so only the user calls it, with /craft:memory, to remember or forget something.
argument-hint: "[what to remember or forget]"
disable-model-invocation: true
---

# Project memory

All memory belongs to the project, in `.claude/memory/` inside the repo, so the team sees it in git. Never write memory to `~/.claude/projects/<project>/memory/`. The `memory-outside-project` hook denies it.

- **Read**: before you act, check if a catalog line below touches the subject. If it does, read the file. Check that a file, a function, or a flag that a memory names still exists.
- **Save**: at the end of an interaction, save what a future conversation needs: a user correction or a confirmed approach (`feedback`), a decision or a constraint that the code does not show (`project`), or where to find outside information (`reference`).
- Do not save what the code, git, CLAUDE.md, or `docs/` already say, what matters only for this conversation, secrets, or a personal preference.

To save:

1. Update the memory that already covers the fact, if one exists.
2. Write one file per fact in `.claude/memory/<type>_<subject>.md`, with the frontmatter `name`, `description`, and `type`. For `feedback` and `project`, add the lines `**Why:**` and `**How to apply:**`.
3. Add one line to `MEMORY.md`: `- [Title](<file>.md): <hook>`. The catalog has no other content.
4. Write absolute dates. Delete a memory that became wrong, with its line.
