---
name: audit
description: One-shot audit of a whole repo, folder or package for bugs, security and data risks, load problems, untested risky code, slow paths and dead code. Read-only report. Use when asked to audit the codebase or check its health. Not for a branch diff or a single bug.
argument-hint: "[folder or package]"
---

# Audit of the repo

**Rule**: read the repo like the person who must keep it running. Report only findings with a concrete case. The report changes no code.

Priority order: correct, safe, holds under the expected load, tested, fast, lean.

## 1. Map first

1. Audit the scope in the argument. Without an argument, audit the whole repo.
2. Read the README, the build and deploy config, the dependency list, the entry points (routes, handlers, jobs, CLI commands) and the tests.
3. Find the expected load: one person who runs a script, or many users and processes at the same time. State the load that you assume.
4. Follow each main flow from start to end: where the data comes in, what is stored, what goes out.
5. Read in full the paths where an error costs the most: user input, money, authentication, data writes, background jobs, state shared between processes.
6. In a large repo, go deep where an error costs the most. Do not read file by file. State the parts that you did not read.

## 2. Dimensions

| Dimension | What to look for | Skill for the detail |
|---|---|---|
| Bug | wrong result, crash, a missed edge (empty, zero, last item, rounding, time zone), a caller that disagrees with what the function returns, the same rule applied in two different ways | `../craft/references/real-world-edges.md` |
| Risk | injection, weak randomness, a secret in the code, user input without a check, an error that is swallowed, writes in the wrong order or without a transaction | `../craft/references/errors.md` |
| Scale | code that is correct for one user and wrong for many (`references/findings.md`) | `../craft/references/performance.md` |
| Missing test | risky logic (a branch, a parser, money, security, a data write) without a test that fails when it breaks. One good test, not coverage | `../craft/references/unit-tests.md` |
| Speed | a large slowdown is a finding. A small gain in a hot loop is a suggestion | `../craft/references/performance.md` |
| Lean | code that must not exist or must be smaller (`references/findings.md`) | `../craft/references/kiss.md`, `../craft/references/yagni.md`, `../craft/references/dry.md` |

The signs of a scale or a lean finding are in `references/findings.md`.

## 3. Check each finding

- Every finding has a concrete case: "this input or this situation gives this wrong result". Without a case, there is no finding.
- Before you call code unused, search the whole tree for it: tests, fixtures, config, and references by string or by dynamic name.
- A limit that the code states on purpose (a comment or a doc that names the limit) is a decision, not a finding. It becomes a finding only when the expected load already crosses the limit.
- Propose the smallest fix that works. Prefer the fix that deletes code. Never add a layer, a framework or a config that the problem does not need.
- Do not report a style preference or a vague worry.

## 4. Report

Write in the language of the user, with short sentences. Explain a technical term the first time that you use it.

1. **What the repo does**: two or three sentences, and the load that you assume.
2. **Findings** in three groups, the most important first. Skip an empty group.
   - **Must fix**: a bug, a security hole, a data loss, or a break at the expected load.
   - **Should fix**: risky code without a test, real slowness, duplication, a function with several jobs, code that must not exist.
   - **Nice to have**: a small speed gain, a shorter form.
3. Number the findings across all groups, so the user can say "fix 2 and 5". Report at most 20. If you left smaller ones out, say how many.
4. Each finding has a title, the path and the lines, and four parts of one or two sentences:
   - **What it is**: what this code does.
   - **Problem**: the concrete case and the wrong result.
   - **Fix**: the smallest change.
   - **If we skip it**: what happens to the user or to the team.
5. **End**:
   - **Verdict**: one line. Healthy, or what to fix first.
   - **Lean**: the lines and dependencies that the lean findings remove, when there are lean findings.
   - **Not checked**: the parts that you did not read or could not run.

Example of a finding:

> **2. Orders go to the wrong day** (`billing/close_day.py:40-52`)
> - **What it is**: at midnight, this job closes the day and bills the orders of that day.
> - **Problem**: the job takes "today" from the server clock in UTC. An order at 00:30 in São Paulo goes to the previous day.
> - **Fix**: compute the day once in the time zone of the shop.
> - **If we skip it**: late orders show the wrong date, and the accounting team fixes them by hand.

If you find nothing, write what the repo does, then "Healthy, nothing to fix", and one line about what you checked.

## After the report

- The report changes no code. Fix a finding only when the user asks, and name the numbers to fix.
- Each fix follows the ATDD of `craft:craft` (`../craft/references/atdd.md`).

## Verification question

Does each finding have a concrete case, the path and the lines, and the smallest fix? Does the report state the assumed load and the parts that you did not read?
