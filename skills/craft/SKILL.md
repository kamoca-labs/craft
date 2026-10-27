---
name: craft
description: Entry point of the refactor (step 6 of ATDD). Reinforces the root rule (less code is better than more code), screens the changed code against SOLID, KISS, YAGNI, DRY and Clean Code, and loads only the skills of the principles with a sign of violation. Use right after the tests turn green, or when asked to refactor or review code quality.
argument-hint: "[file or scope]"
---

# Craft: refactor guided by principles

The tests are green. If you are in the ATDD loop and a scenario remains, go back to step 2 with the next one. The screening waits for the end. If all scenarios are green, do step 6 now: refactor the code you touched and run the tests of the touched domains again (step 7). If the refactor is done, this is step 7: confirm that everything passes and report.

## Root rule: less code

**Less code is better than more code.** This rule is not a new principle. It is what KISS, YAGNI and DRY have in common. It applies to all code you write, not only in the refactor:

- Reuse what already exists before you write (`craft:kiss`).
- Write only what a test or a current use requires (`craft:yagni`).
- Generic code starts reusable, outside the specific case (`craft:dry`).

## How to proceed

1. **Scope**: the argument, if there is one. Otherwise, what changed (`git diff` of the branch against main).
2. **Lint**: if the project has a lint script (`craft:setup` creates one), run it on the files in scope. A size or complexity violation is already a sign: `max-lines-per-function` and `complexity` → `craft:functions`, `max-params` → `craft:arguments`, `max-depth` → `craft:guard-clauses`, `max-lines` → `craft:single-responsibility`. Never turn off or loosen the rule to make it pass.
3. **Root rule**: before the screening, look in the scope for code you can delete. Deleting is worth more than adding.
4. **Screening**: read the code in scope and ask the question of each row in the table below.
5. **Go deeper only where there is a sign**: for each principle with a sign, load its skill with the `Skill` tool (`craft:<skill>`) and follow it. Do not load the skill of a principle without a sign.
6. **One refactor at a time**: change, run the tests of the refactored module, continue. Never edit a test to make it pass. The verification has limited rounds:
   - one screening round, with all rows of the table
   - one batch of fixes with all findings of the screening, one refactor at a time
   - at most one confirmation round, only over what changed

   Then stop and report. A leftover finding goes to the report, not to a new round.
7. **Report**: one line for the root rule and one per principle with a sign (`craft:dry: attachment limit rule unified in MAX_ATTACHMENT_SIZE`). Say which ones had no sign.

## Screening

| Skill | Principle | Screening question |
|---|---|---|
| `craft:single-responsibility` | S of SOLID | Does this module change for more than one reason, or for more than one kind of person? |
| `craft:open-closed` | O of SOLID | Did a new case require an edit to an existing `if`/`switch`? |
| `craft:liskov-substitution` | L of SOLID | Does an implementation throw "not supported", ignore a parameter, or require `instanceof` from the caller? |
| `craft:interface-segregation` | I of SOLID | Does anyone receive a type, object or props and use only a fraction of it? |
| `craft:dependency-inversion` | D of SOLID | Does the business rule import a database, HTTP, LLM, clock or storage directly? |
| `craft:kiss` | KISS | Is there a simpler way that passes the same tests? |
| `craft:yagni` | YAGNI | Is there an option, parameter, layer or abstraction without a current use? |
| `craft:dry` | DRY | Is the same business rule, text or style written in two places, or is generic code tied to one case? |
| `craft:i18n` | English and i18n | Is there code outside English, user-visible text written directly in code, a date or number formatted by hand, or a fixed width on a text container? |
| `craft:naming` | Names | Does any name need the code (or a comment) to be understood? |
| `craft:functions` | Functions | Does any function do more than one thing or mix abstraction levels? |
| `craft:arguments` | Arguments | More than three parameters, or a boolean that changes the behavior? |
| `craft:guard-clauses` | Guard clause | Is there an `if` nested more than one level, or an `else` after `return`? |
| `craft:side-effects` | Side effect | Does any function change state, write or send something that its name does not announce? |
| `craft:comments` | Comments | Is there a comment that explains *what* the code does? |
| `craft:errors` | Errors | Is any error swallowed, logged and ignored, or turned into a silent `null`? Does any error on screen leave the user without a way to recover? |
| `craft:performance` | Performance | Does any block run over much data or on a hot path (loop in loop, query in loop, repeated I/O, serial calls) without a measurement that compares forms? |
| `craft:clean-tests` | Tests | Does any test have logic, test more than one behavior, have a vague name or sit in the wrong layer? |
| `craft:unit-tests` | Unit and integration | Does any test verify a private method, a mock of a mock, a getter, the library or the appearance? |
| `craft:test-ids` | Test id | Is any interactive element without `data-testid`, with a generic or position-based id, or does a component not pass the parent attributes through? |
| `craft:e2e-tests` | E2E | Does any E2E test verify something that does not stop the user from reaching the goal (style, `hover`, exact text, field by field)? |
| `impeccable` (external skill) | Interface | Does the change alter the UI (component, CSS, template)? |

The `impeccable` row does not load a skill. If the answer is yes, suggest `/impeccable audit` or `/impeccable harden` over the touched files to the user. Never run the command yourself.

If the `impeccable` skill is not in the session skill list, suggest the installation from the official site, https://impeccable.style (repo `pbakaus/impeccable`). The site says to run `/plugin marketplace add pbakaus/impeccable` and to install **Impeccable** in `/plugin`, on the **Discover** tab.

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
- **Performance × readability**: the faster form wins only with a measurement at the real volume and a comparison between forms (`craft:performance`).
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
- [ ] Tests of the touched domains run again, with a filter, and green. The full suite runs in CI, or locally only with the consent of the user (see the filtered run in `craft:atdd`).
