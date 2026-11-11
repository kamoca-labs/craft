---
name: plan
description: Turns a large scope into a linear activity with no inferred decision. Claude (the Elephant) asks the user in rounds, writes the activity, and a fresh Haiku subagent (the Goldfish) lists the gaps. Only the user calls it, with /craft:plan.
argument-hint: "<scope>"
disable-model-invocation: true
model: sonnet
---

# Plan

The user owns every decision. Claude owns every fact. The plan ends when an executor can do each item without a guess. This skill writes no code.

Session id: `${CLAUDE_SESSION_ID}`. Activity CLI: `node ${CLAUDE_PLUGIN_ROOT}/scripts/activity.ts <command> --session ${CLAUDE_SESSION_ID}`.

The pattern comes from the Elephant-Goldfish model of Google (`github.com/google/elephant-goldfish-model`). You are the Elephant: you hold the context and write. The Goldfish reviews in a fresh context, without this conversation.

## Rules

- **Facts are your work.** Find them in the repo, the docs, a tool or the web. Never ask the user a fact that you can find.
- **Decisions are the user's work.** Scope, behavior, name, priority, trade-off. Never choose one for the user, not even a "safe default".
- **Do not infer.** A missing, vague or partial answer does not close the question. Ask it again in the next round.
- **Record a fact with its source.** A fact without a source is an assumption, and an assumption becomes a question.

## Steps

1. **Start.** Tell the user once that the skill sets Sonnet only for this turn, and that a session switch to Sonnet keeps it for the whole interview (in Claude Code, `/model sonnet`). Read `../craft/references/engineer.md` and follow it. Read the memory catalog `.claude/memory/MEMORY.md`. Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/codebase-map.ts`.
2. **Scope.** Use the argument. Without one, ask the scope in one sentence and stop. The spec is `.claude/local/plans/<slug>.md`. If it exists, continue from its open questions. To create it, read `references/spec-format.md`.
3. **Facts.** Read what the scope touches (code, `CLAUDE.md`, `docs/`, `.claude/memory/`, config). Do not ask a question that a fact answers.
4. **Rounds.** List every decision that the scope needs. The frontier is the open decisions whose prerequisites are all decided. Read `references/round.md`, ask the whole frontier in one message, record the answers in the spec, and repeat until the frontier is empty.
5. **Activity.** Read `../craft/references/activity.md`, sections 1 and 2. Write the activity from the spec: each item has `do`, `accept` and `check`. Put the spec path in the goal, so the Goldfish reads it. Before you write, read `../craft/references/ste.md`.
6. **Goldfish.** Start the `craft:goldfish` subagent. Give it only the path of the activity file. Never give it a summary, the decisions or this conversation: a review with your context is not a Goldfish review.
7. **Gaps.** Each `GAP` line becomes a question of the next round (step 4). Then update the spec, change the activity with `replan`, and run the Goldfish again.
8. **Limit.** Stop when the Goldfish replies `NO GAPS`, or after 3 Goldfish rounds. After 3 rounds, show the open gaps, and the user decides each one.
9. **Close.** Set the spec `status: complete`. Show the activity path and the ordered list of items, and ask the user to approve. After the approval, the next step is `/craft:craft <slug>`.
