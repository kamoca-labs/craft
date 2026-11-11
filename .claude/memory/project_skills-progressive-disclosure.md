---
name: skills-progressive-disclosure
description: All plugins use few entry skills and references; open items of the migration
type: project
---

On 2026-11-05 craft, docker, design and git moved to progressive disclosure, (the plan file was removed; it stays in git history). The rules for craft are in `CLAUDE.md`.

- Only entry skills are visible to Claude: craft 5, docker 4, design 8, git 9. Each description has 300 characters or less, and no colon followed by a space (it breaks the YAML).
- Knowledge lives in `skills/<owner>/references/`. Rules for every session live in `rules/`, and a hook injects them.
- `scripts/skill-budget.ts` in each plugin measures the listing.

**Why:** the skill listing has a budget of 1% of the context. With 79 skills, Claude Code dropped descriptions and Claude did not know when to use a skill. In `bench/`, the cost of craft over the baseline fell from +238% to +60%, with 32/32 hidden checks.

**How to apply:** before you add, move or rename a skill, follow `CLAUDE.md`, then run the structure test and `node scripts/skill-budget.ts`. Open items of the user: `git:undo` as user-only, new names for `git:ci`, `git:ci-cd` and `docker:ci`, phase 0 trigger evals, and phase 5 release. The branches are local and not pushed: craft on `feat/tasks-reminder`, the others on `feat/progressive-disclosure`.
