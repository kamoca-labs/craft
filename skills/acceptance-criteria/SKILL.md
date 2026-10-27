---
name: acceptance-criteria
description: Verifiable acceptance criteria for the scenarios of step 1 of craft:atdd. Use when you write the Given/When/Then scenarios, before you ask the user to approve the specification.
argument-hint: "[specification]"
user-invocable: false
---

# Verifiable acceptance criteria

A criterion that nobody verifies does not close the cycle. Before you ask the user for approval, check each scenario:

- The `Then` states a value that you can observe: a code (`422`), a text, a count, a state. Never an adjective (`fast`, `correct`, `friendly`).
- The scenario states which test proves it: the layer (`craft:clean-tests`) and the filtered command that runs it.
- The `Given` fixes the input data. The scenario does not depend on order or on the clock.
- If you cannot say how a test proves the scenario, the criterion is vague. Rewrite the scenario or ask the user.

After the user approves, load the `craft:tasks` skill.

## Verification

- Each scenario has an observable `Then` and the test that proves it.
- No scenario uses an adjective in place of a value.
