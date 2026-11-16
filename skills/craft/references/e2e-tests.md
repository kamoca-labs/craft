# E2E covers only the user journey

**Rule**: an E2E test proves that the user **can reach a goal** in the real system. It follows the journey from start to end and verifies only the result that proves the goal. Everything else stays out of E2E.

Example: "if I create an item, the item appears in the list" is E2E.

## Contents

- Why
- When to write
- Where to run
- What goes in
- What never goes in
- Signs of violation
- Cut question
- How to write
- Example
- Limits
- Verification question

## Why

- The E2E test is the slowest, the most expensive and the most fragile of the suite. Each extra test costs minutes of CI and one more point of failure.
- An assert on a detail breaks on every layout change, but the system keeps working. The team learns to ignore the red.
- AI tends to generate exhaustive tests: one for each field, one for each state, one for each variation. This volume hides the journeys that matter.
- The business rule and the edge cases have faster and more precise coverage in the unit test (`unit-tests.md`).

## When to write

**Only with the feature ready**: all its ATDD cycles are green and the full flow works on screen.

- Never write the E2E test before the code or during the red/green cycle. With an incomplete screen, the E2E test fails for a reason that is not a bug, creates noise and delays delivery.
- The acceptance tests of ATDD stay in unit and integration (`unit-tests.md`). They guide the code.
- With the feature ready, write one E2E test for each new journey. If the feature does not create a new journey, do not write E2E.

## Where to run

Only in a container. Follow the e2e-container reference.

## What goes in

- **Critical journey**: sign in, register, create, edit and delete the main item, buy, search and find.
- **Result of the goal**: the item appears in the list, stays there after the page reloads, another screen shows the same data.
- **Flow that exists only end to end**: several pages in sequence, login, redirect, permission.
- **At most one error path per journey**, and only when the error changes what the user can do. Example: with the wrong password, the user does not get in.
- **Screen states**: loading, empty, error and no permission, when the screen has these states. Each state goes through the [cut question](#cut-question), and the assert verifies what the user sees at the end:
  - **Loading**: the screen leaves loading and shows the data. The spinner itself has no assert.
  - **Empty**: the empty list shows the action that leads to the goal. Example: the button to create the first item.
  - **Error**: with the API failing, the screen shows the error and the retry action. This is the error path of the journey.
  - **No permission**: the user without access sees neither the action nor the screen.

## What never goes in

| Forbidden assert in E2E | Where it goes |
|---|---|
| Appearance | no functional test: see the section "Behavior, not appearance" of `clean-tests.md` |
| Animation, transition, time of a toast on screen | nowhere |
| Exact wording of a label, title or message | verify that the message appears, not each word of it |
| Field-by-field validation, each input combination, edge case of the rule | `unit-tests.md` |
| Intermediate state: spinner, button disabled during submit, step by step of a wizard | nowhere: verify only the final result |
| What the user does not see: request sent, payload, store, `localStorage`, console | `unit-tests.md`, in integration |
| One test per screen or per component | merge into one journey, or delete |

## Signs of violation

- An assert on appearance (the section "Behavior, not appearance" of `clean-tests.md`).
- `toHaveText` with the whole sentence of a label or paragraph.
- One test per form field (`'empty name shows error'`, `'invalid email shows error'`, `'short phone shows error'`).
- Name that describes the screen, not the goal: `'products page'`, `'edit modal'`.
- Asserts in the middle of the journey that do not prove the goal.
- `waitForTimeout`, `cy.wait(2000)`, `sleep`.
- `expect(await locator.isVisible()).toBe(true)`: it does not wait. Use `await expect(locator).toBeVisible()`.
- Locator by CSS, XPath, `nth-child` or generated class, or by position (`.first()`, `.nth()`).
- A locator written in the spec, not in a page object (`e2e-structure.md`).
- `force: true` on a click: if the element is not ready for the test, it is not ready for the user.
- Test that depends on another test having run before, or `mode: 'serial'`.
- E2E written before the feature is ready, or used as the red test of ATDD.

## Cut question

Ask this question for **each assert**:

> If this assert fails, is the user blocked from reaching their goal?

- If the answer is no, delete the assert.
- If the test is left with no assert, delete the test.
- If the assert verifies a business rule with several inputs, move the rule to `unit-tests.md` and leave only one case in E2E.

## How to write

1. **Name** = the goal of the user, as a sentence: `'user creates a request and sees it in the list'`.
2. **One test per journey**, on the happy path. Add an error path only by the rule in [What goes in](#what-goes-in).
3. **Locator by test id**: `getByTestId` first (`test-ids.md`), always inside a page object. Use `getByRole` or `getByLabel` only for an element that is not yours. Never use CSS, XPath or position.
4. **Waiting assert**: `toBeVisible`, `toHaveURL`, `toHaveCount`. Never use a fixed wait. For a condition outside the page (a job, the state of an API), use `expect.poll`.
5. **Setup outside the UI**: create the data and the login session through API, seed or `storageState`, in a fixture. Use the UI only in the steps that are the journey.
6. **Isolated test**: each test creates its own data with a unique name, deletes it in the teardown of a fixture, and does not depend on the order.
7. **Structure**: spec, page object and fixture, as `e2e-structure.md` says. The steps of the journey go in `test.step`, named for the person who reads the report or watches the video.
8. **Real system**: the backend and the database are the test ones of the project. Mock only third-party services (payment, email, SMS).

## Example

```ts
// before: 3 tests, none proves that the user creates an item
test('empty name shows error', async ({ page }) => { /* ... */ })
test('name with 256 characters shows error', async ({ page }) => { /* ... */ })
test('spinner appears when saving', async ({ page }) => { /* ... */ })

// after: 1 test, 1 journey, 1 result
test('user creates an item and sees it in the list', async ({ itemsPage, itemName }) => {
  await test.step('create the item', () => itemsPage.create(itemName))

  await expect(itemsPage.table).toContainText(itemName)
})
```

The validation of the name (empty, too long) goes to the unit test of the rule. The spinner leaves the suite. The page object `itemsPage` and the fixture `itemName` (a unique name, deleted after the test) are in the example of `e2e-structure.md`.

## Limits

- If accessibility is a requirement, run an audit (example: `axe`) once per page in a separate suite. Do not spread accessibility asserts across the journeys.
- A step in the middle of the journey can have an assert when the next step depends on it and the failure is confusing without it. Example: confirm the URL after login before you continue.

## Verification question

Does each E2E test have the name of a user goal, and does each assert in it fail only when the user is blocked from reaching that goal? Was the feature ready when the test was born?
