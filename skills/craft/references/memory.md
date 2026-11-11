# Project memory

Memory belongs to the project, in `.claude/memory/` inside the repo. Never write it to `~/.claude/projects/` (a hook denies it).

- The catalog is `.claude/memory/MEMORY.md`. Read it at the start of the work.
- Before you act, read the memory file of a catalog line that touches the subject. If the memory names a file, a function, or a flag, check that it still exists.
- At the end of an interaction, save without a request what a future session needs: a user correction, a confirmed approach, or a decision that the code and git do not show.
- Never save a secret, a credential, or personal data: the memory goes to git and the team reads it. Do not save what the code, git, CLAUDE.md or `docs/` already say, or a personal preference (it goes to `~/.claude/CLAUDE.md`).
- One file per fact: `.claude/memory/<type>_<subject>.md` with `name`, `description` and `type` (`feedback`, `project`, `reference`), plus `**Why:**` and `**How to apply:**`.
- Add one line to `MEMORY.md`: `- [Title](<file>.md): <hook>`. Update a memory that already covers the fact. Write absolute dates. Delete a wrong one. Keep the catalog short: merge or delete old lines when it grows.
