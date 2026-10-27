---
name: memory
description: Long-term project memory in `.claude/memory/`, inside the repo, in the format of Claude Code auto memory. The memory hook injects this skill and the catalog in every session. The memory-outside-project hook denies memory outside the project. Use it when you learn something that matters for a future conversation, or when asked to remember or forget something.
argument-hint: "[what to remember or forget]"
---

# Project memory

**Rule**: all memory belongs to the project. It lives in `.claude/memory/`, inside the repo, and goes to git with the rest. Never write memory to `~/.claude/projects/<project>/memory/`. It is valid only on this machine and the team cannot see it. The `memory-outside-project` hook denies this write.

## Read

- The `MEMORY.md` catalog is at the end of this context.
- Before you act, check if a catalog line touches the subject. If it does, read the memory file.
- A memory states what was true when it was written. If it names a file, function, or flag, check that it still exists.

## Save

At the end of each interaction, ask: does this matter for a future conversation? If it does, save it without waiting for a request.

| `type` | What it stores |
|---|---|
| `feedback` | a user correction, or an approach the user confirmed |
| `project` | work in progress, deadline, decision, or constraint that the code and git do not show |
| `reference` | where to find information outside the repo (issue, dashboard, doc) |

Do not save:

- what the code, git, CLAUDE.md, or `docs/` already say
- what is valid only for the current conversation
- secrets, credentials, or personal data: the repo belongs to the team
- the personal preference of one person: it goes in that person's `~/.claude/CLAUDE.md`

Steps:

1. Search the catalog for a memory that already covers the fact. If one exists, update its file.
2. Write one file per fact in `.claude/memory/<type>_<subject>.md`:

   ```markdown
   ---
   name: <subject-in-kebab-case>
   description: <one line, used to decide if the memory is relevant>
   type: feedback | project | reference
   ---

   <the fact>

   **Why:** <the reason, in feedback and project>
   **How to apply:** <when and how to use it, in feedback and project>
   ```

3. Add one line to the catalog: `- [Title](<file>.md): <one-line hook>`.
4. Replace a relative date with an absolute date ("Thursday" becomes "2026-10-15").
5. If a memory became wrong, delete its file and its line.

## Catalog

`MEMORY.md` is only the catalog: one line per memory, with no frontmatter, no instruction, and no memory content. Keep each line short. The hook injects only the start of the catalog, so merge or delete old lines when it grows.
