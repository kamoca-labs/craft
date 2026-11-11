---
name: activity-flow
description: Activity flow (craft 0.18.0) replaces META, TaskCreate and /craft:tasks. Decisions and limits.
type: project
---

The request of the user became an activity: a linear markdown list in `.claude/local/activities/<slug>/index.md`, built by `craft:craft` (`skills/craft/references/activity.md`), held by the `activity-gate` Stop hook.

**Why:** the META task and `TaskCreate` caused compatibility problems. The user wants a plain `.md` they can follow, ignored by git, one line at a time, with a parent file and child files for a very complex request.

**How to apply:**
- Decisions of the user (2026-11-10): remove `meta-goal`, `tasks` and `/craft:tasks` without an alias. The markdown is the only source, with a sealed evidence record. One folder per activity. `craft:craft` is the entry, not a new skill.
- `/goal` cannot be run by a skill or a hook, so there is no binding. The hook asks for the line `ACTIVITY COMPLETE: <id>, N/N verified`, and `goal-line` gives the condition.
- Claude Code overrides a Stop hook after 8 blocks in a row without a tool call. The stop limit of the activity counts stops without new evidence.
- No Jira or Asana integration exists: `export` is a dry run. `TaskCompleted` is not used. `bench/` was not run for this change.
- The seal (`.claude/local/.seal`) guards against mistakes, not against someone who reads the key.
- Evidence can carry sealed files (captures, responses). A `review` item is approved by Claude, and the user rejects with `reopen`, which brings the item and its dependents back. The CLI prints one short line per command to save tokens (estimate: about 9 thousand tokens for 6 items).
