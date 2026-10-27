---
name: clean-tests
description: Clean Code applied to tests, and the catalog of test layers. Use when you write or review any test, to choose the layer (unit, component, integration, E2E) and load its skill. Also use when a test has logic (if, loop, calculation), tests several behaviors at once, has a vague name, has a huge setup, depends on order or real time, or verifies implementation instead of behavior.
argument-hint: "[file or scope]"
user-invocable: false
---

# A test is also code

**Rule**: the test is the executable specification. It is **readable as a sentence**, tests **one behavior**, has no logic, and fails for one reason only, with a message that says which. Each behavior stays in the **lowest layer** that covers it.

## Layers

Choose the layer of each test before you write it. Then load the skill of the layer with the `Skill` tool.

| Layer | What it covers | Skill |
|---|---|---|
| Unit, component, integration | the business rule and all its edge cases, through the public interface | `craft:unit-tests` |
| E2E | only the user journey: the user can reach the goal in the real system. It enters only with the feature ready and runs only in a container | `craft:e2e-tests` |

- Most tests stay in unit and integration. E2E has few tests, one for each critical journey.
- The acceptance tests of ATDD stay in unit and integration. E2E comes after, with the feature ready.
- An edge case never moves up to E2E.
- Style, `hover`, color and animation have no functional test in any layer.

## Why

- When the test fails, you read the test, not the code. The test must explain what was expected.
- A test with logic can have its own bug and pass wrongly.
- A test coupled to the implementation breaks on every refactor, and then the refactor stops happening.
- A test in the wrong layer costs a lot: an edge case in E2E makes the suite slow and fragile.

## Signs of violation

- `if`, `for`, a calculation, or a call to the tested function itself to produce the expected value.
- Vague name: `test('works')`, `test('case 2')`.
- Several behaviors in one test: arrange, act, assert, act, assert...
- Setup of 40 lines with data that the test never reads.
- Tests that depend on the execution order or on shared state.
- `Date.now()`, `Math.random()`, real network.
- Assert on an internal call (`expect(repo.save).toHaveBeenCalledWith(...)`) when the observable result is enough.
- Test in the wrong layer: an edge case in E2E, or a business rule that only E2E covers.

## How to apply

1. **Layer**: choose from the [Layers](#layers) table and load its skill.
2. **Name** = expected behavior, as a sentence: `'attachment above 10 MB is rejected with 422'`.
3. **Arrange / Act / Assert structure**, each part visible, separated by a blank line.
4. **Literal expected value**: `assert.equal(total, 95)`, not `assert.equal(total, 100 * 0.95)`.
5. **Show only the relevant data**. The rest stays in a test builder with defaults (`makeTicket({ status: 'closed' })`).
6. **One behavior per test**. Several asserts are fine if they describe the same result.
7. **Deterministic**: inject the clock and randomness (`craft:dependency-inversion`).
8. **Test what is seen from outside**: return value, persisted state, HTTP response, what the user sees. Mock only at the boundary.
9. **DRY in moderation**: repeating a value in the test to keep it readable is better than hiding it in a helper (`craft:dry`).

## Example

```ts
// before
test('discount', () => {
  for (const total of [50, 100, 200]) {
    const expected = total >= 100 ? total * 0.9 : total
    expect(applyDiscount(total)).toBe(expected)
  }
})

// after
test('purchase of 100 or more gets a 10% discount', () => {
  expect(applyDiscount(200)).toBe(180)
})

test('purchase below 100 gets no discount', () => {
  expect(applyDiscount(50)).toBe(50)
})
```

Case tables (`test.each`) are acceptable when each row has **literal** input and output and the name interpolates the case.

## Limits

- A contract test reused across implementations (`craft:liskov-substitution`) can iterate over the implementations. The loop is over the target, not over the calculation of the expected value.
- An E2E test naturally has several steps. Even so, it covers one journey only (`craft:e2e-tests`).

## Verification question

If this test fails, do the name and the message already tell me which behavior broke, without opening the code? Is the test in the lowest layer that covers this behavior?
