import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const write = (file: string, content: string) => sandbox().pre('e2e-spec', 'Write', { file_path: file, content })
const SPEC = 'e2e/specs/items.spec.ts'
const GUIDE = 'e2e/guides/items.guide.ts'
const PAGE = 'e2e/pages/items.page.ts'
const COMPONENT = 'e2e/components/data-table.component.ts'
const FIXTURES = 'e2e/fixtures/index.ts'

test('denies a locator in a spec and in a guide', () => {
  for (const file of [SPEC, GUIDE]) {
    for (const code of ["await page.getByTestId('item-save-button').click()", "page.getByRole('button', { name: 'Save' })", "page.locator('.row')", 'frame.frameLocator("#pay")']) {
      const result = write(file, code)
      assert.strictEqual(result.status, 2, `${file}: ${code}`)
      assert.match(result.stderr, /\[craft:e2e-spec\].*page object/)
    }
  }
})

test('denies a position in a spec', () => {
  for (const code of ['await itemsPage.rows.first().click()', 'itemsPage.rows.nth(2)', 'itemsPage.rows.last()']) {
    assert.strictEqual(write(SPEC, code).status, 2, code)
  }
})

test('denies a page object built by hand in a spec', () => {
  assert.strictEqual(write(SPEC, 'const itemsPage = new ItemsPage(page)').status, 2)
  assert.strictEqual(write(SPEC, 'const table = new DataTableComponent(page)').status, 2)
})

test('denies a value import from @playwright/test in a spec and in a guide, and allows a type import', () => {
  for (const file of [SPEC, GUIDE]) {
    assert.strictEqual(write(file, "import { test, expect } from '@playwright/test'").status, 2, file)
    assert.strictEqual(write(file, "const { test } = require('@playwright/test')").status, 2, file)
    assert.strictEqual(write(file, "import type { Page } from '@playwright/test'").status, 0, file)
    assert.strictEqual(write(file, "import { expect, test } from '../fixtures/index.ts'").status, 0, file)
  }
})

test('denies a stub of the network in a spec', () => {
  assert.strictEqual(write(SPEC, "await page.route('**/pay', (route) => route.fulfill({ status: 200 }))").status, 2)
})

test('denies the screencast in a spec and allows it in a guide', () => {
  const code = "await page.screencast.start({ path: 'docs/videos/items.webm' })"
  assert.strictEqual(write(SPEC, code).status, 2)
  assert.strictEqual(write(GUIDE, code).status, 0)
})

test('denies a CSS or XPath locator, an element handle and a position in a page object', () => {
  for (const code of ["this.table = page.locator('.items-table')", "this.table = page.locator('//table')", "const handle = await page.$('.row')", 'return this.rows.first()', 'return this.rows.nth(i)', 'return this.rows.last()']) {
    for (const file of [PAGE, COMPONENT]) assert.strictEqual(write(file, code).status, 2, `${file}: ${code}`)
  }
})

test('denies inheritance in a page object', () => {
  assert.strictEqual(write(PAGE, 'export class ItemsPage extends BasePage {').status, 2)
})

test('denies the screencast in a page object', () => {
  assert.strictEqual(write(PAGE, 'await this.page.screencast.stop()').status, 2)
})

test('allows a page object that holds locators by test id and one method per intent', () => {
  const code = [
    "this.table = page.getByTestId('items-table')",
    "this.nameInput = page.getByTestId('item-name-input')",
    'rowFor(sku: string) { return this.table.getByTestId(`item-card-${sku}`) }',
    'await expect(this.page).toHaveURL(/items/)',
    "this.menu = page.getByRole('navigation').filter({ has: page.getByTestId('menu') })",
    'export class ItemsPage {',
  ].join('\n')
  assert.strictEqual(write(PAGE, code).status, 0)
})

test('allows fixtures, setup and support files to hold locators, stubs and the playwright import', () => {
  const code = "import { test as base } from '@playwright/test'\nawait page.route('**/pay', fulfill)\nawait page.getByTestId('login-submit-button').click()"
  for (const file of [FIXTURES, 'e2e/auth.setup.ts', 'e2e/support/items-api.ts', 'e2e/playwright.config.ts']) {
    assert.strictEqual(write(file, code).status, 0, file)
  }
})

test('denies in every file of e2e a wait by time, a forced click, serial mode and a non-waiting assert', () => {
  const codes = [
    'await page.waitForTimeout(2000)',
    "await this.saveButton.click({ force: true })",
    "test.describe.configure({ mode: 'serial' })",
    'expect(await itemsPage.table.isVisible()).toBe(true)',
    'expect(await itemsPage.rows.count()).toBe(3)',
    "expect(await itemsPage.title.getAttribute('class')).toBe('x')",
  ]
  for (const file of [SPEC, GUIDE, PAGE, FIXTURES, 'e2e/auth.setup.ts']) {
    for (const code of codes) assert.strictEqual(write(file, code).status, 2, `${file}: ${code}`)
  }
})

test('allows the waiting asserts and the poll', () => {
  const code = 'await expect(itemsPage.table).toBeVisible()\nawait expect(itemsPage.rows).toHaveCount(3)\nawait expect.poll(() => jobStatus()).toBe(\'done\')'
  assert.strictEqual(write(SPEC, code).status, 0)
})

test('a non-waiting assert is read on its own line, in a file without semicolons', () => {
  const code = 'await expect(await api.fetchTotal())\n  .toBe(3)\nconst rows = await table.rows.count()'
  assert.strictEqual(write(FIXTURES, code).status, 0)
})

test('ignores a comment', () => {
  assert.strictEqual(write(SPEC, "// never use page.getByTestId here\n/* page.waitForTimeout(5) */\nawait itemsPage.create(itemName)").status, 0)
})

test('reads an absolute path, an Edit and a MultiEdit', () => {
  assert.strictEqual(write(`/home/dev/app/${SPEC}`, "page.getByTestId('x')").status, 2)
  assert.strictEqual(sandbox().pre('e2e-spec', 'Edit', { file_path: SPEC, old_string: 'a', new_string: "page.getByTestId('x')" }).status, 2)
  const edits = [{ old_string: 'a', new_string: 'await itemsPage.create(name)' }, { old_string: 'b', new_string: 'await page.waitForTimeout(10)' }]
  assert.strictEqual(sandbox().pre('e2e-spec', 'MultiEdit', { file_path: SPEC, edits }).status, 2)
})

test('allows any content in files outside the E2E folder', () => {
  for (const file of ['src/items.spec.ts', 'src/components/ItemCard.test.tsx', 'tests/unit/items.test.ts', 'src/pages/items.page.ts', 'README.md']) {
    assert.strictEqual(write(file, "page.getByTestId('x')\nawait page.waitForTimeout(10)").status, 0, file)
  }
})

test('names what was found and where to look', () => {
  const { stderr } = write(SPEC, "page.getByTestId('x')")
  assert.match(stderr, /Found: .*locator/)
  assert.match(stderr, /e2e-structure\.md/)
})

test('acts only while a craft activity is active', () => {
  assert.strictEqual(sandbox({ activity: false }).pre('e2e-spec', 'Write', { file_path: SPEC, content: "page.getByTestId('x')" }).status, 0)
})
