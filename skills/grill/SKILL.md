---
name: grill
description: Interview before a plan. Claude finds the facts, asks each open decision in rounds with 3 to 5 options, never infers an answer, and writes the spec to .claude/local/grill/<slug>.md. Only the user calls it, with /craft:grill.
argument-hint: "<idea, plan or change to grill>"
disable-model-invocation: true
---

# Grill

The user owns every decision. Claude owns every fact. The grill ends when no decision in the spec comes from Claude.

## Rules

- **Facts are your work.** Find them in the repo, the docs, a tool or the web, or with a sub-agent for a wide search. Never ask the user a fact that you can find.
- **Decisions are the user's work.** Scope, behavior, name, priority, trade-off. Never choose one for the user, not even a "safe default".
- **Do not infer.** A missing, vague or partial answer does not close the question. Ask it again in the next round.
- **Record a fact with its source.** A fact without a source is an assumption, and an assumption becomes a question.

## Steps

1. **Subject**: use the argument. Without one, ask the subject in one sentence and stop. The spec is `.claude/local/grill/<slug>.md`. If it exists, continue from its open questions. To create it, read `references/spec-format.md`.
2. **Facts**: read what the subject touches (code, `CLAUDE.md`, `docs/`, `.claude/memory/`, config). Do not ask a question that a fact answers.
3. **Decision tree**: list every decision that the subject needs. The **frontier** is the open decisions whose prerequisites are all decided.
4. **Round**: read `references/round.md`. Ask the whole frontier in one message, record the answers in the spec, recompute the frontier, and repeat. A new fact need goes back to step 2.
5. **Audit**: the frontier is empty. Read the spec line by line. A statement without a user decision or a source is your assumption. Make it a question and go back to step 4.
6. **Close**: set `status: complete`, show the path and a short summary, and ask the user to confirm. Do not implement. The next step is the user's choice, for example `/craft:atdd` or `/craft:craft` with the path of the spec.
