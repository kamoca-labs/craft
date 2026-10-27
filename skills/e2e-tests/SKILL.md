---
name: e2e-tests
description: E2E (end-to-end) tests cover only the user journey, enter only with the feature ready and run only in a container. Use when you write, generate or review an E2E test (Playwright, Cypress, Dusk, Selenium) that checks style, hover, color, animation, exact text, field-by-field validation, an intermediate state or a detail the user does not see. Also use when the E2E suite grows with one test per screen or per field, when an E2E test appears before the feature is ready, or when an E2E test runs outside a container.
argument-hint: "[file or scope]"
user-invocable: false
---

# E2E covers only the user journey

**Rule**: an E2E test proves that the user **can reach a goal** in the real system. It follows the journey from start to end and verifies only the result that proves the goal. Everything else stays out of E2E.

Example: "if I create an item, the item appears in the list" is E2E. "On hover, the button changes its background color" is not.

## Why

- The E2E test is the slowest, the most expensive and the most fragile of the suite. Each extra test costs minutes of CI and one more point of failure.
- A style or detail assert breaks on every layout change, but the system keeps working. The team learns to ignore the red.
- AI tends to generate exhaustive tests: one for each field, one for each state, one for each variation. This volume hides the journeys that matter.
- The business rule and the edge cases have faster and more precise coverage in the unit test (`craft:unit-tests`).

## When to write

**Only with the feature ready**: all its ATDD cycles are green and the full flow works on screen.

- Never write the E2E test before the code or during the red/green cycle. With an incomplete screen, the E2E test fails for a reason that is not a bug, creates noise and delays delivery.
- The acceptance tests of ATDD stay in unit and integration (`craft:unit-tests`). They guide the code.
- With the feature ready, write one E2E test for each new journey. If the feature does not create a new journey, do not write E2E.

## Where to run

**Only in a container**, never on the host. The `e2e-container` hook denies the E2E runner outside `docker run`, `docker exec` and `docker compose run/exec`.

- Use the official image of the runner, in the same version as the package of the project. Playwright: `mcr.microsoft.com/playwright:v<version>-noble`. Cypress: `cypress/included:<version>`.
- Declare an `e2e` service in the dev compose file, in the same network as the app. The test reaches the app by the service name (`http://app:3000`), not by `localhost`.
- Run with `docker compose run --rm e2e` or with the `test:e2e` script of the project, which calls this command.
- If the project does not have the `e2e` service yet, create the service before you run the test. Never run `npx playwright test` or `npx cypress run` directly on the host.

The container gives the same browser, the same fonts and the same system in dev and in CI. So a test that passes on one machine also passes in CI.

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
| Style: color, background, `hover`, visual focus, font, size, position, shadow, CSS class | nowhere, or in a visual regression suite, if the project has one |
| Animation, transition, time of a toast on screen | nowhere |
| Exact wording of a label, title or message | verify that the message appears, not each word of it |
| Layout: order of fields, number of columns, responsiveness | nowhere, or in the visual regression suite |
| Field-by-field validation, each input combination, edge case of the rule | `craft:unit-tests` |
| Intermediate state: spinner, button disabled during submit, step by step of a wizard | nowhere: verify only the final result |
| What the user does not see: request sent, payload, store, `localStorage`, console | `craft:unit-tests`, in integration |
| One test per screen or per component | merge into one journey, or delete |

## Signs of violation

- `toHaveCSS`, `toHaveClass`, `getComputedStyle`, `hover()` followed by an assert.
- `toHaveText` with the whole sentence of a label or paragraph.
- One test per form field (`'empty name shows error'`, `'invalid email shows error'`, `'short phone shows error'`).
- Name that describes the screen, not the goal: `'products page'`, `'edit modal'`.
- Asserts in the middle of the journey that do not prove the goal.
- `waitForTimeout`, `cy.wait(2000)`, `sleep`.
- Locator by CSS, XPath, `nth-child` or generated class.
- Test that depends on another test having run before.
- E2E written before the feature is ready, or used as the red test of ATDD.
- `npx playwright test`, `npx cypress run` or another E2E runner run directly on the host.

## Cut question

Ask this question for **each assert**:

> If this assert fails, is the user blocked from reaching their goal?

- If the answer is no, delete the assert.
- If the test is left with no assert, delete the test.
- If the assert verifies a business rule with several inputs, move the rule to `craft:unit-tests` and leave only one case in E2E.

## How to write

1. **Name** = the goal of the user, as a sentence: `'user creates a request and sees it in the list'`.
2. **One test per journey**, on the happy path. Add an error path only by the rule in [What goes in](#what-goes-in).
3. **Locator by test id**: `getByTestId` first (`craft:test-ids`). Use `getByRole` or `getByLabel` only for an element that is not yours. Never use CSS, XPath or position.
4. **Waiting assert**: `toBeVisible`, `toHaveURL`, `toHaveCount`. Never use a fixed wait.
5. **Setup outside the UI**: create the data and the login session through API, seed or `storageState`. Use the UI only in the steps that are the journey.
6. **Isolated test**: each test creates its own data and does not depend on the order.
7. **Real system**: the backend and the database are the test ones of the project. Mock only third-party services (payment, email, SMS).

## Example

```ts
// before: 4 tests, none proves that the user creates an item
test('save button changes color on hover', async ({ page }) => {
  await page.goto('/items/new')
  await page.locator('.btn-primary').hover()
  await expect(page.locator('.btn-primary')).toHaveCSS('background-color', 'rgb(37, 99, 235)')
})

test('empty name shows error', async ({ page }) => { /* ... */ })
test('name with 256 characters shows error', async ({ page }) => { /* ... */ })
test('spinner appears when saving', async ({ page }) => { /* ... */ })

// after: 1 test, 1 journey, 1 result
test('user creates an item and sees it in the list', async ({ page }) => {
  await page.goto('/items/new')

  await page.getByTestId('item-name-input').fill('Chair')
  await page.getByTestId('item-save-button').click()

  await expect(page.getByTestId('items-table')).toContainText('Chair')
})
```

The validation of the name (empty, too long) goes to the unit test of the rule. The hover, the color and the spinner leave the suite.

## Limits

- If the product **is** the visual (design editor, chart generator), the result of the goal can be visual. Even so, use a visual regression suite with screenshots, not `toHaveCSS` inside the E2E test.
- If accessibility is a requirement, run an audit (example: `axe`) once per page in a separate suite. Do not spread accessibility asserts across the journeys.
- A step in the middle of the journey can have an assert when the next step depends on it and the failure is confusing without it. Example: confirm the URL after login before you continue.

## Verification question

Does each E2E test have the name of a user goal, and does each assert in it fail only when the user is blocked from reaching that goal? Was the feature ready when the test was born, and does it run in a container?
