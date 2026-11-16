# E2E follows the page object model

**Rule**: the spec tells the journey, the page object knows the screen, and the fixture owns the setup. Each layer does one job. A spec holds no locator and no setup, and a page object never holds the assert of the goal. The `e2e-spec` hook denies the most common breaks of this rule.

## Contents

- Why
- Layout
- The layers
- Page object
- Fixtures
- Session
- Data
- Config
- Video
- Guides
- Example
- Signs of violation
- Verification question

## Why

- A locator or a login written in many specs breaks in many places when the screen changes. One change must touch one file.
- The page object is the contract between the spec and the screen, as the test id is the contract between the component and the test (`test-ids.md`).
- Setup inside the test body is not undone when the test fails. The teardown of a fixture always runs, so no data is left behind to make the next run flaky.
- This is the structure that Playwright documents: fixtures for setup and isolation, page objects for the API of a screen.

## Layout

```
e2e/
  playwright.config.ts
  auth.setup.ts
  fixtures/index.ts              the only file that exports `test` and `expect`
  pages/items.page.ts            one class per screen
  components/data-table.component.ts   one class per region that repeats
  support/items-api.ts           API client and data factories
  specs/items.spec.ts            one file per journey
  guides/items.guide.ts          videos for manuals (see Guides)
playwright/.auth/                in .gitignore
```

From the first test, each screen that a journey visits has its own page object.

## The layers

| Layer | Holds | Never holds |
|---|---|---|
| Spec | the journey in user steps (`test.step`), the assert of the goal | locators, `new Page(...)`, setup, login, data cleanup, stubs |
| Page object | the locators of one screen or region, one method per user intent | the assert of the goal, business data, a wait by time, CSS or XPath |
| Fixture | the session, the data with its teardown, the page objects, the stubs of third parties | the journey |

## Page object

- `readonly` locators, built in the constructor, found by `getByTestId` first (`test-ids.md`). The spec asserts on these members (`itemsPage.table`).
- A method is a user intent: `create(name)`, not `clickSaveButton()`.
- A method can end with a waiting assert that confirms its own screen loaded (`toHaveURL`). The assert of the goal stays in the spec.
- A list item is found by its business id: `rowFor(sku)`, never by position.
- A region that repeats across screens (menu, table, dialog) is a component object with its own root locator. The page objects compose it.
- No `BasePage` and no `extends`. Compose small objects.

## Fixtures

- One `fixtures/index.ts` with `test.extend`. The specs import `test` and `expect` from it, never from `@playwright/test`. When the file grows, split by domain and join with `mergeTests`.
- The fixture builds the page objects (`itemsPage: async ({ page }, use) => use(new ItemsPage(page))`). The spec never calls `new`.
- Code before `await use()` is the setup. Code after it is the teardown, and it runs also when the test fails.
- Stub a third party with `page.route` inside a fixture. Never route your own backend.
- Use `{ scope: 'worker' }` only for what is costly and shared by the worker, such as an account.

## Session

- Log in once in the `setup` project (`auth.setup.ts`) and save `storageState` in `playwright/.auth/`. Put that folder in `.gitignore`: the files hold live cookies.
- **Tests that do not change shared server data**: one account for all.
- **Tests that change shared server data**: one account per worker, from a worker fixture that uses `testInfo.parallelIndex`.
- Log in through the API of the app when it has one. Use the UI only in the test of the login itself, with `test.use({ storageState: { cookies: [], origins: [] } })`.
- Another role: `test.use({ storageState })` in the file or in the `describe` of that role.

## Data

- Create through the API in a fixture (`request`), not through the UI, unless the creation is the journey.
- The name has a unique part (`randomUUID()` or `testInfo.testId`), so parallel tests and retries do not collide.
- Delete after `await use()`, in the same fixture that created.
- Never share a variable between tests, and never use `test.describe.configure({ mode: 'serial' })`. If the steps depend on each other, they are one journey: one test, with `test.step` for each part.

## Config

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    video: {
      mode: process.env.CI ? 'retain-on-failure' : 'on',
      size: { width: 1280, height: 720 },
      show: { actions: { duration: 500 }, test: { level: 'step' } },
    },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testDir: './specs',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
})
```

- One project, Chromium. Add Firefox or WebKit only when the product must support them.
- `fullyParallel` makes every test run alone and balances the shards. A test that needs another to run first is a defect.
- A test that passes only on a retry is flaky. Fix the cause. Never raise `retries`.
- No `webServer`: the app is another service of the compose file (`e2e-container.md`), reached by `BASE_URL`.
- When CI splits the run with `--shard=x/y`, use the `blob` reporter and join the shards with `merge-reports`.
- `show` in `video` exists in the Playwright version of this guide (1.64). Check the version of the package before you use it.

## Video

- **Locally and in the container**: record every test (`on`). The video is how the user checks what the test did. You cannot watch a video: for your own check, read the trace and the screenshot of the failure.
- **In CI**: `retain-on-failure`. A video of a green test only costs storage.
- `show.actions` marks each action on the screen, and `show.test` with `level: 'step'` prints the name of each `test.step`. Name the steps for the person who watches.
- **As evidence of an activity item**: run the suite so the output lands in the evidence folder, and the user opens the videos without a token cost:
  `docker compose run --rm -v "$ACTIVITY_EVIDENCE_DIR:/evidence" e2e npx playwright test --output=/evidence`
- The videos use test data only. A video shows everything that is on the screen.
- `test-results/` and `playwright-report/` are in `.gitignore`.

## Guides

A guide is a video for a manual of the product. It is not a test of behavior, so it never goes inside a spec.

- A file `guides/<topic>.guide.ts`, with its own config (`guides.config.ts`) that has only the `setup` and `guides` projects. The default run and the CI gate never load it. It runs on demand.
- It reuses the page objects and the fixtures of the journeys, and imports `test` from `fixtures/index.ts`. No locators in it either.
- It records with `page.screencast`: `start({ path, size })`, `showActions()`, `showChapter(title, { description })` and `stop()`. The API exists since Playwright 1.59.
- Seeded data with made-up values, a fixed viewport and a fixed date (`page.clock`), so the video is the same on every run.
- The output goes to `docs/videos/<topic>.webm`. The video is a binary: keep it out of git, as a CI artifact or a release asset, unless the project decides otherwise.
- If the flow breaks, the guard of the page object fails the guide. A broken manual is found by the run, not by a reader.

## Example

```ts
// e2e/fixtures/index.ts
import { randomUUID } from 'node:crypto'
import { test as base } from '@playwright/test'
import { ItemsPage } from '../pages/items.page.ts'

export { expect } from '@playwright/test'

export const test = base.extend<{ itemsPage: ItemsPage; itemName: string }>({
  itemsPage: async ({ page }, use) => use(new ItemsPage(page)),
  itemName: async ({ request }, use) => {
    const name = `Chair ${randomUUID()}`
    await use(name)
    await request.delete('/api/items', { params: { name } })
  },
})
```

```ts
// e2e/pages/items.page.ts
import type { Locator, Page } from '@playwright/test'

export class ItemsPage {
  readonly table: Locator
  private readonly nameInput: Locator
  private readonly saveButton: Locator

  constructor(private readonly page: Page) {
    this.table = page.getByTestId('items-table')
    this.nameInput = page.getByTestId('item-name-input')
    this.saveButton = page.getByTestId('item-save-button')
  }

  async create(name: string) {
    await this.page.goto('/items/new')
    await this.nameInput.fill(name)
    await this.saveButton.click()
  }
}
```

```ts
// e2e/specs/items.spec.ts
import { expect, test } from '../fixtures/index.ts'

test('user creates an item and sees it in the list', async ({ itemsPage, itemName }) => {
  await test.step('create the item', () => itemsPage.create(itemName))

  await expect(itemsPage.table).toContainText(itemName)
})
```

## Signs of violation

- A `getByTestId`, `getByRole` or `locator(` in a spec or in a guide.
- `new ItemsPage(page)` in a spec, or an import of `test` or `expect` from `@playwright/test` outside `fixtures/`.
- The same login steps in three specs, or a `beforeEach` that logs in through the UI.
- Data created in the body of the test and deleted at its end, or never deleted.
- A fixed name in the data (`'Chair'`) in a suite with `fullyParallel`.
- A page object with `waitForTimeout`, with CSS or XPath, with `.nth()` or `.first()`, with `extends`, or with a method named after a click.
- A page object used by no test, or a screen with its locators written in the spec.
- `test.describe.configure({ mode: 'serial' })`, or a test that reads what another test created.
- `page.screencast` inside a spec.
- A `storageState` file or a video in the repo.

## Verification question

If the screen changes, does one file change? If a test fails in the middle, is its data deleted anyway? Does any spec still hold a locator?
