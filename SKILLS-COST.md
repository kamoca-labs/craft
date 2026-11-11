# Skills cost reduction plan

Status: decisions D1 to D9 set on 2026-11-11. Steps 2 to 6 done. Next: step 7 (commit and release, when the user asks). Written on 2026-11-11.

The goal is to cut the tokens that craft adds to a session. The user decides each item. Claude does one item at a time. This plan continues `SKILLS-ARCHITECTURE.md`, which cut the skill listing.

## 1. New direction (decided by the user on 2026-11-11)

- craft is an opt-in engineer toolkit. Nothing loads in a session until the user calls a craft skill.
- The SessionStart injections stop. Each rule moves into the skill that needs it, or is deleted.
- `craft:craft` is the work skill: it receives a task, breaks it into small parts and executes them one at a time.
- ATDD stops being a skill. It becomes a reference of `craft:craft`, used when the task changes behavior.
- More skills are allowed when each one is small and has one job.
- `plan` and `grill` merge. The merged skill takes a large scope, closes every gap so the model infers nothing, and writes a linear activity document. It uses the Elephant-Goldfish pattern (section 3).
- `craft:craft` then executes the activity. For software, it loads ATDD (test first) and the clean code principles. No separate refactor skill for now.
- A run of the `bench/` suite is optional. It is no longer required before a change.

## 2. Measured state

Measured in this repo (target 1.0.0) on 2026-11-11. Tokens are an estimate: characters / 4.

| Cost | When it loads | Characters | Tokens (estimate) |
|---|---|---|---|
| Skill listing (5 visible skills) | every session | 1,284 | 320 |
| SessionStart rules: `ste` 591, `memory` 2,090, `codebase-map` 538, `change` 1,684, `tool` 819, `verify` 893, `challenge` 917, `state-of-the-art` 1,115 | every session | 8,647 | 2,160 |
| Memory catalog (inside `memory`) | every session | up to 10,000 (`CONTEXT_LIMIT`) | up to 2,500 |
| `reminder` | every prompt | 276 | 70 |
| `craft:craft` body | every implementation request (the reminder loads it) | 9,708 | 2,430 |
| `atdd` body | every behavior change | 5,547 | 1,390 |
| `audit`, `hook`, `setup`, `grill` bodies | on a rare call | 6,358, 5,473, 4,692, 2,126 | 1,590, 1,370, 1,170, 530 |
| References | only when Claude reads one | 830 to 7,070 each | 0 until read |
| Deny messages (`hooks/locales/en.json`) | only when a hook denies | 4,453 in total | 0 until a deny |

With the new direction, a session that does not call craft pays only the listing. If every skill is user-only (`disable-model-invocation: true`), the listing is 0 too.

Splitting a skill does not add a fixed cost when the new skills are user-only. A model-visible skill adds its description (300 characters or less) to every session. A smaller body costs less on each call.

## 3. Target layout

| Skill | Job | Loads |
|---|---|---|
| `craft:plan <scope>` | Merge of `grill` and the split of the task. Closes every gap with the user, then writes the linear activity. Writes no code. Steps below. | `.claude/local/activities/<slug>/index.md` |
| `craft:craft <activity>` | Executes the activity one item at a time. For a software item, it follows `references/atdd.md` (test first) and the clean code principles (the screening table and `references/<principle>.md`). Without an activity, it suggests `/craft:plan` first (D1). | `references/engineer.md` once per call |
| `craft:audit`, `craft:hook`, `craft:setup`, `craft:memory` | No change of job. | |

`grill` is deleted. Its references (`round.md`, `spec-format.md`) move to `plan`.

### `craft:plan`: the Elephant-Goldfish pattern

Source: Google `elephant-goldfish-model` (EGM), Apache-2.0, last push 2026-11-11 ([repo](https://github.com/google/elephant-goldfish-model)). EGM is "not an officially supported Google product" (its README). In EGM, the Elephant holds the project context and drafts the specification. A Goldfish reviews the draft in a fresh context, without the earlier conversation, to find unstated assumptions. The user approves. A review in the same context "is not a Goldfish review" (`skills/egm-review/SKILL.md`).

The steps of `craft:plan`:

1. **Elephant reads.** Claude reads the code (`codebase-map`), the memory catalog and the scope.
2. **Elephant asks.** Claude lists each open decision and asks the user in rounds with options (`round.md` of `grill`). Claude never infers an answer.
3. **Elephant writes.** Claude writes the linear activity (`references/activity.md`): each item has `do`, `accept` and `check`.
4. **Goldfish reviews.** A fresh subagent reads only the activity file and the files it names. It lists each point where it must guess: a vague `accept`, a missing input, an item that needs a decision.
5. **Close the gaps.** Each Goldfish point goes back to step 2 as a question to the user. Repeat steps 3 to 5 until the Goldfish finds no gap, at most 3 rounds (D8). After 3 rounds, show the open gaps and the user decides.
6. **User approves.** Then the user calls `/craft:craft`.

Models (D9):

- **Goldfish**: a plugin subagent `agents/goldfish.md` with `model: haiku` and only the `Read` tool. It reviews only the items that are not verified, and reads only the spec and the files that those items name. A plugin subagent supports the `model` field ([sub-agents](https://code.claude.com/docs/en/sub-agents)). `craft:plan` gives it only the path of the activity file.
- **Elephant**: Sonnet. The skill field `model: sonnet` applies only "for the rest of the current turn", and "the session model resumes when you send your next prompt" ([skills](https://code.claude.com/docs/en/skills)). The interview has many turns, so the field covers only the first one. `context: fork` does not fit: a fork does not see the conversation and cannot run the interview. So the Elephant is the session model. `craft:plan` sets `model: sonnet` for its first turn, and the skill tells the user once that `/model sonnet` keeps it for the whole interview.

Cost: each Goldfish review is one subagent call. It reads the activity and the named files. EGM uses five review stages. This plan uses one gap reviewer (D7).

All skills use `disable-model-invocation: true` (D1). The skill listing of craft costs 0 per session.

Where each SessionStart rule goes:

| Rule | Target |
|---|---|
| `change`, `tool`, `verify`, `challenge`, `state-of-the-art` | Merged into one short `skills/craft/references/engineer.md`. `plan` and `craft` read it. |
| `ste` | `skills/craft/references/ste.md`. `plan` reads it before it writes the activity. A skill reads it before it writes a doc, a commit or a PR/MR (D2). |
| `memory` and its catalog | `plan` reads `.claude/memory/MEMORY.md`. `/craft:memory` stays for the user (D4). |
| `codebase-map` | `plan` runs it when it reads the code. |
| `reminder` (every prompt) | Deleted. |

## 4. Decisions (2026-11-11)

| # | Decision | Answer of the user |
|---|---|---|
| D1 | Who starts a skill | Only the user. When the user calls `craft` without a plan, Claude suggests `/craft:plan` once. If the user goes on, `craft` builds a one-item activity and executes it: the engineer keeps the control (answer of 2026-11-11). |
| D2 | `ste` writing rule | A reference. |
| D3 | A skill that splits the big task into small tasks | Yes. The name is free. It is `craft:plan` in this layout. No separate `task` skill. |
| D4 | Project memory | A reference. `plan` reads the catalog. |
| D5 | Hooks that deny and `refactor-on-green` | On only while a craft activity is active in the session. |
| D6 | `plan` and `grill` | One skill, `craft:plan`, with the Elephant-Goldfish pattern. No `craft:refactor` for now: the principles stay in `craft:craft`. |
| D7 | Goldfish reviewers | One gap reviewer: a fresh subagent that lists each point where it must guess. |
| D8 | Limit of review rounds | Stop when the Goldfish finds no gap, or after 3 rounds. After 3 rounds, show the open gaps and the user decides. |
| D9 | Models | Goldfish on Haiku, Elephant on Sonnet. Opus is not needed. |
| D10 | Scope of Elephant and Goldfish | Only the gap search of `craft:plan`. No other skill, step or review uses them or proposes them. |

## 5. Items carried from the first map

These items stay valid in the new layout. Status: `open`, `approved`, `rejected` or `done`.

| # | Change | Saving (estimate) | Status |
|---|---|---|---|
| A | Lower the memory catalog limit (`CONTEXT_LIMIT` in `hooks/rules/memory.ts`) from 10,000 to about 3,000 characters, only if a hook loads the catalog again (after D4, no hook loads it) | up to 1,750 tokens per session | rejected |
| B | Remove the checklist of the principles flow in `craft:craft`. It repeats "How to proceed". | about 230 tokens per call | done |
| C | Remove the two activity rows from the screening table | about 80 tokens per call | done |
| D | In `atdd`, remove the lines that the engineer rules already give (visual-only change, change without a test, inject a dependency, never edit a test). Cut "Why one scenario per turn" to one sentence. | about 340 tokens per behavior change | done |
| E | Move the code example of `craft:hook` to `references/example.md` | about 500 tokens per call | done |
| F | Move the tables of `audit` and `setup` to references | about 500 tokens per call | done |

`skills/memory/SKILL.md` is the source of the memory rule today (`skillBody('memory')`). Do not delete it before D4.

`plugin.json` has a long description. No source shows that it goes into the context. Status: not verified.

## 6. Work order

1. The user answered D1 to D5 on 2026-11-11.
2. Move the SessionStart rules to their targets and delete the injection hooks.
3. Move `atdd` to `skills/craft/references/atdd.md`. Update every link (`audit`, `setup`, `hook`, the hook messages).
4. Create `craft:plan` from `grill` and the activity part of `craft:craft`. Delete `grill`. Set `disable-model-invocation: true` on every skill.
5. Make the deny hooks and `refactor-on-green` act only while an activity is active (D5).
6. Do the items of section 5.
7. After each step, run the hook tests, the structure test and `node scripts/skill-budget.ts`. Update `CLAUDE.md`, `README.md` and `USAGE.md` to the new layout.

## 7. Log

Write one line per step when it is done: the step, the date, the result of the check.

- 2026-11-11: the requirement to run the `bench/` suite was removed from `CLAUDE.md`.
- 2026-11-11: the user answered D1 to D5.
- 2026-11-11: the user merged `plan` and `grill` with the Elephant-Goldfish pattern (D6).
- 2026-11-11: the user chose one gap reviewer (D7) and a limit of 3 rounds (D8).
- 2026-11-11: the user chose Haiku for the Goldfish and Sonnet for the Elephant (D9).
- 2026-11-11: step 2 done. The 5 rules merged into `skills/craft/references/engineer.md` (4,796 characters, was 5,428), plus `ste.md` and `memory.md`. `codebase-map` is `scripts/codebase-map.ts`. No hook runs at SessionStart or on a prompt: a session that does not call craft now gets 0 characters of rules (was 8,647 plus the catalog). Hook suite green, `skill-budget.ts`: 5 skills, 1,284 characters (D1 cuts this in step 4).
- 2026-11-11: step 3 done. `skills/atdd` is now `skills/craft/references/atdd.md`, with its 4 references in `skills/craft/references/`. `craft:craft` links all 5. `test-first` accepts `craft:craft` as the flow. Hook suite 168/168 green. `skill-budget.ts`: 4 skills visible, 1,049 description characters (was 1,284).
- 2026-11-11: step 4 done. `skills/plan` replaces `grill` (Elephant on Sonnet, `agents/goldfish.md` on Haiku with `Read, Grep, Glob`). `craft:craft` executes an activity and suggests `/craft:plan` without one. Every skill uses `disable-model-invocation: true`: `skill-budget.ts` reports 0 skills, 0 characters. `/craft:setup` no longer writes the ATDD line. Hook suite 169/169, `claude plugin validate` passes. `claude plugin details` projects about 552 always-on tokens, because it counts the descriptions of user-only skills. The skills docs say that a skill with `disable-model-invocation: true` has its "Description not in context" ([skills](https://code.claude.com/docs/en/skills)). The two sources disagree; the official docs win. The `goldfish` agent description is a new fixed cost (about 60 tokens in the projection).
- 2026-11-11: step 5 done. `readActiveInput` in `hooks/lib.ts` ends the hook with exit 0 when the session has no active activity. The 10 deny and inject hooks use it. `activity-gate` already acted only with an activity. Hook suite 173/173.
- 2026-11-11: the user approved B to F of section 5. A is rejected: no hook loads the memory catalog now.
- 2026-11-11: the user limited the Elephant and the Goldfish to the gap search of `craft:plan` (D10). A structure test denies `goldfish` in any other skill or reference.
- 2026-11-11: Goldfish cost cut. It keeps only `Read` (no repo search), reviews only the items that are not verified, and reads each named file once. The first test on Haiku spent about 97,000 tokens on 20 items, most on items already verified.
- 2026-11-11: step 6 done. B: the checklist of `craft:craft` is gone, and step 6 says to commit the refactor apart. C: done in step 4. D: `atdd.md` keeps only what `engineer.md` does not say. E: `skills/hook/references/example.md`. F: `skills/setup/references/stacks.md` and `skills/audit/references/findings.md`. `claude plugin details`, on-invoke tokens: audit 2.1k to 1.8k, hook 1.8k to 1.5k, craft 3.5k to 3.2k, setup 1.5k to 1.2k. Hook suite 174/174.
