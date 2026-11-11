---
name: craft
description: Turns a request to implement, fix, refactor, migrate or write something into a linear activity, one verified item at a time (a small task gets one item). Also refactors code by principles when tests turn green. Not for questions.
argument-hint: "[request, file or scope]"
---

# Craft

Session id: `${CLAUDE_SESSION_ID}`. Activity CLI: `node ${CLAUDE_PLUGIN_ROOT}/scripts/activity.ts <command> --session ${CLAUDE_SESSION_ID}` (commands in the usage that the script prints).

## A request to do something: build an activity

A request to implement, fix, refactor, migrate or write something starts here. Read `references/activity.md` and follow it: it turns the request into a numbered list in `.claude/local/activities/<slug>/index.md`, you do one item at a time, and the `activity-gate` hook holds the end of the turn until every item has evidence. The file format is in `references/activity-format.md`. A question or an analysis is not an activity: answer it. A small task is an activity with one item, well defined: a fix of one line still gets its check and its evidence. Work that is not code fits too.

The items that change code follow `craft:atdd`, and the refactor of the code you touched follows the rest of this skill.

## Refactor guided by principles

The tests are green. If you are in the ATDD loop and a scenario remains, go back to step 2 with the next one. The screening waits for the end. If all scenarios are green, do step 6 now: refactor the code you touched and run the tests of the touched domains again (step 7). If the refactor is done, this is step 7: confirm that everything passes and report.

## Root rule: less code

**Less code is better than more code.** This rule is not a new principle. It is what KISS, YAGNI and DRY have in common. It applies to all code you write, not only in the refactor:

- Reuse what already exists before you write (`references/kiss.md`).
- Write only what a test or a current use requires (`references/yagni.md`).
- Generic code starts reusable, outside the specific case (`references/dry.md`).

## How to proceed

1. **Scope**: the argument, if there is one. Otherwise, what changed (`git diff` of the branch against main).
2. **Lint**: if the project has a lint script (`craft:setup` creates one), run it on the files in scope. A size or complexity violation is already a sign: `max-lines-per-function` and `complexity` → `references/functions.md`, `max-params` → `references/arguments.md`, `max-depth` → `references/guard-clauses.md`, `max-lines` → `references/single-responsibility.md`. Never turn off or loosen the rule to make it pass.
3. **Root rule**: before the screening, look in the scope for code you can delete. Deleting is worth more than adding.
4. **Screening**: read the code in scope and ask the question of each row in the table below.
5. **Go deeper only where there is a sign**: for each principle with a sign, read its reference with the `Read` tool (`references/<name>.md`, in the folder of this skill) and follow it. Do not read the reference of a principle without a sign.
6. **One refactor at a time**: change, run the tests of the refactored module, continue. Never edit a test to make it pass. The verification has limited rounds:
   - one screening round, with all rows of the table
   - one batch of fixes with all findings of the screening, one refactor at a time
   - at most one confirmation round, only over what changed

   Then stop and report. A leftover finding goes to the report, not to a new round.
7. **Report**: one line for the root rule and one per principle with a sign (`references/dry.md: attachment limit rule unified in MAX_ATTACHMENT_SIZE`). Say which ones had no sign.

## Screening

| Reference | Principle | Screening question |
|---|---|---|
| `references/activity.md` | Activity | Is the request big, or does it have several steps, or must each result be proven? |
| `references/activity-format.md` | Activity file | Must you repair or read the activity file by hand? |
| `references/single-responsibility.md` | S of SOLID | Does this module change for more than one reason, or for more than one kind of person? |
| `references/open-closed.md` | O of SOLID | Did a new case require an edit to an existing `if`/`switch`? |
| `references/liskov-substitution.md` | L of SOLID | Does an implementation throw "not supported", ignore a parameter, or require `instanceof` from the caller? |
| `references/interface-segregation.md` | I of SOLID | Does anyone receive a type, object or props and use only a fraction of it? |
| `references/dependency-inversion.md` | D of SOLID | Does the business rule import a database, HTTP, LLM, clock or storage directly? |
| `references/kiss.md` | KISS | Is there a simpler way that passes the same tests? |
| `references/yagni.md` | YAGNI | Is there an option, parameter, layer or abstraction without a current use? |
| `references/dry.md` | DRY | Is the same business rule, text or style written in two places, or is generic code tied to one case? |
| `references/english-code.md` | English code | Is any identifier, comment, log or internal message outside English? |
| `references/i18n.md` | i18n | Is user-visible text written directly in code, or a date, number or currency formatted by hand? |
| `references/i18n-layout.md` | Layout for translation | Does a text container have a fixed width, or does the CSS use a physical direction (left, right)? |
| `references/naming.md` | Names | Does any name need the code (or a comment) to be understood? |
| `references/functions.md` | Functions | Does any function do more than one thing or mix abstraction levels? |
| `references/arguments.md` | Arguments | More than three parameters, or a boolean that changes the behavior? |
| `references/guard-clauses.md` | Guard clause | Is there an `if` nested more than one level, or an `else` after `return`? |
| `references/side-effects.md` | Side effect | Does any function change state, write or send something that its name does not announce? |
| `references/comments.md` | Comments | Is there a comment that explains *what* the code does? |
| `references/errors.md` | Errors | Is any error swallowed, logged and ignored, or turned into a silent `null`? Does any error on screen leave the user without a way to recover? |
| `references/performance.md` | Performance | Does any block run over much data or on a hot path (loop in loop, query in loop, repeated I/O, serial calls) without a measurement that compares forms? |
| `references/clean-tests.md` | Tests | Does any test have logic, test more than one behavior, have a vague name or sit in the wrong layer? |
| `references/unit-tests.md` | Unit and integration | Does any test verify a private method, a mock of a mock, a getter, the library or the appearance? |
| `references/test-ids.md` | Test id | Is any interactive element without `data-testid`, with a generic or position-based id, or does a component not pass the parent attributes through? |
| `references/e2e-tests.md` | E2E | Does any E2E test verify something that does not stop the user from reaching the goal (appearance, exact text, field by field)? |
| `design:review` (design plugin) | Interface | Does the change alter the UI (component, CSS, template)? |

The `design:review` row does not load a skill. If the answer is yes, suggest `/design:review` over the touched files to the user. Never run it as a side effect of the refactor. The design plugin owns visual work and includes Impeccable; a separate Impeccable installation is not required. If design is unavailable, report the missing plugin and the unverified visual review.

## When principles conflict

Principles are tools, not goals. When one pulls against another, use this order:

1. **Correct behavior** (green tests, handled errors).
2. **Readability** (names, functions, guard clauses): the next reader understands without help.
3. **Root rule, KISS and YAGNI**: less code, less concept.
4. **Measured performance**: a measured gain above the noise can cost readability, with the comparison in the commit. Without a measurement, readability wins.
5. **DRY**: only when the duplication is of the same knowledge.
6. **Extensibility (O, D, I of SOLID)**: only when the variation already exists, not when it is imagined.

Common conflicts:

- **DRY × KISS**: duplication is cheaper than the wrong abstraction. Wait for the third repetition before you extract.
- **Open/Closed or dependency inversion × YAGNI**: create the abstraction when there is a second real implementation or an I/O boundary that needs a test double. Before that, it is speculation.
- **Performance × readability**: the faster form wins only with a measurement at the real volume and a comparison between forms (`references/performance.md`).
- **Single responsibility × KISS**: separating responsibilities does not mean chopping the code into ten one-line classes. If the parts always change together, they are one responsibility.

## Checklist before you leave step 6

- [ ] Lint of the scope has no violation (when the project has lint).
- [ ] Root rule applied: nothing in scope can be deleted.
- [ ] Screening done on all rows of the table.
- [ ] Skill loaded and applied for each principle with a sign.
- [ ] At most one confirmation round after the batch of fixes.
- [ ] Every optimization has a measurement before and after and beat another form.
- [ ] Refactor commit separate from the behavior commit.
- [ ] Same behavior (no test was edited to pass).
- [ ] Tests of the touched domains run again, with a filter, and green. The full suite runs in CI, or locally by you, with no question, only when the push needs it (`../atdd/references/filtered-tests.md`).
