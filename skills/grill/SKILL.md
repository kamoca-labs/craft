---
name: grill
description: Interview before a plan. Claude finds the facts, asks each open decision in rounds with 3 to 5 options, never infers an answer, and writes the spec to .claude/local/grill/<slug>.md. Only the user calls it, with /craft:grill.
argument-hint: "<idea, plan or change to grill>"
disable-model-invocation: true
---

# Grill

The user owns every decision. Claude owns every fact. The grill ends when no decision in the spec comes from Claude.

## Rules

- **Facts are your work.** A fact is in the repo, the docs, a tool or the web. Find it yourself (read, run, search, or a sub-agent for a wide search). Never ask the user a fact that you can find.
- **Decisions are the user's work.** A decision is a choice between valid options: scope, behavior, name, priority, trade-off. Never choose one for the user, not even a "safe default".
- **Do not infer.** An answer that is missing, vague or partial does not close the question. Ask it again in the next round, with the part that is still open.
- **Record a fact with its source** (a path, a command or a URL). A fact without a source is an assumption, and an assumption becomes a question.

## Steps

### 1. Name the subject

Use the argument. If there is no argument, ask the user for the subject in one sentence and stop.

Make a short slug in English from the subject (`orders-pagination`). The spec file is `.claude/local/grill/<slug>.md`. If the file exists, read it and continue from its open questions. Do not start again.

If `.claude/local/.gitignore` does not exist, create it with the line `*`. The folder belongs to this machine and never goes to git.

### 2. Find the facts

Read what the subject touches: the code, `CLAUDE.md`, `docs/`, `.claude/memory/`, and the config. Write each fact with its source. Do not ask a question that a fact already answers.

### 3. Build the decision tree

List every decision that the subject needs. A decision can depend on another decision. The **frontier** is the set of open decisions whose prerequisites are all decided. Only the frontier goes into the next round.

### 4. Ask one round

Send all the frontier questions in one message, in the language of the user. Each question has 3 to 5 options, each different and valid. Mark one option as recommended, with a reason in one line. The user can choose a letter or write an own answer.

```
**Q1. <short title>**
<the decision, and why it matters, in one or two lines>

- A) <option>
- B) <option> (recommended: <reason>)
- C) <option>
- D) other: write your own answer

**Q2. ...**

Answer with the number and the letter (1B, 2C) or with your own text. Answer what you can. An open question comes back in the next round.
```

Then stop and wait for the reply. Do not do other work in this turn.

### 5. Record the answers

Write the spec file after every round, before the next round:

- An answer that chooses an option or gives a clear text: move the question to **Decisions**, with the answer of the user.
- "Use your recommendation" for a question: this is a user decision. Record it as "recommended option, accepted by the user".
- No answer, or a vague answer: keep it in **Open questions**.
- An answer that changes a decided item: update the item and mark the decisions that depended on it as open again.
- An answer that puts something outside the scope: move it to **Out of scope**.

Recompute the frontier. If new facts are necessary, find them first (step 2). Ask the next round (step 4).

### 6. Audit before the end

The frontier is empty. Read the spec from the start, line by line. For each statement, ask: did the user decide it, or does a source prove it? A statement without one of the two is an assumption from you. Make it a question and go back to step 4.

### 7. Close

Set `status: complete`, show the path of the spec and a short summary of the decisions. Ask the user to confirm that the spec is correct. Do not implement it. When the user confirms, the next step is the user's choice, for example `/craft:atdd` or `/craft:craft` with the path of the spec.

## Spec format

```markdown
---
subject: <the subject in one line>
slug: <slug>
status: open | complete
updated: <YYYY-MM-DD>
rounds: <number of rounds>
---

# <subject>

## Goal
<what is true when the work is done, in the words of the user>

## Facts
- <fact> (source: <path, command or URL>)

## Decisions
- **<title>**: <answer>. Decided by the user in round <n>.

## Open questions
- **<title>**: <the question and its options>

## Out of scope
- <item>: <reason from the user>
```
