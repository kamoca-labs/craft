import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { sandbox, type Sandbox } from './helpers.ts'

const SCRIPT = path.join(import.meta.dirname, '..', '..', 'scripts', 'codebase-map.ts')
const BUDGET = 2000

function writeFiles(box: Sandbox, files: Record<string, string>) {
  for (const [file, content] of Object.entries(files)) {
    const target = path.join(box.projectDir, file)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, content)
  }
}

function sessionContext(box: Sandbox): string | null {
  fs.mkdirSync(box.projectDir, { recursive: true })
  const result = spawnSync('node', [SCRIPT], { cwd: box.projectDir, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: box.projectDir } })
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout.trim() || null
}

test('lists the top-level names of each source folder', () => {
  const box = sandbox()
  writeFiles(box, {
    'src/lib/money.ts': 'export function formatPrice() {}\nexport const VAT = 0.2\nfunction helper() {}\n',
    'src/services/order.ts': 'export class OrderService {}\n',
    'app/report.py': 'def build_report():\n    pass\n\nclass Report:\n    pass\n\ndef _private():\n    pass\n',
    'pkg/clock/clock.go': 'package clock\n\nfunc Now() {}\n\nfunc local() {}\n',
  })
  const context = sessionContext(box)!
  assert.match(context, /^src\/lib\/: formatPrice, VAT$/m)
  assert.match(context, /^src\/services\/: OrderService$/m)
  assert.match(context, /^app\/: build_report, Report$/m)
  assert.match(context, /^pkg\/clock\/: Now$/m)
  assert.doesNotMatch(context, /helper|_private|local/)
})

test('skips tests, dependencies and build output', () => {
  const box = sandbox()
  writeFiles(box, {
    'src/upload.ts': 'export function upload() {}\n',
    'src/upload.test.ts': 'export function uploadFixture() {}\n',
    'tests/helpers.ts': 'export function makeUser() {}\n',
    'node_modules/left-pad/index.js': 'export function leftPad() {}\n',
    'dist/bundle.js': 'export function bundled() {}\n',
  })
  const context = sessionContext(box)!
  assert.match(context, /upload/)
  assert.doesNotMatch(context, /uploadFixture|makeUser|leftPad|bundled/)
})

test('stays inside the budget, lists shared code first and counts the folders left out', () => {
  const box = sandbox()
  const files: Record<string, string> = { 'src/lib/money.ts': 'export function formatPrice() {}\n' }
  for (let index = 0; index < 200; index++) {
    files[`src/screens/screen${index}/index.ts`] = `export function renderScreenNumber${index}() {}\n`
  }
  writeFiles(box, files)
  const context = sessionContext(box)!
  assert.ok(context.length <= BUDGET + 300, `map has ${context.length} chars`)
  assert.match(context, /^src\/lib\/: formatPrice$/m)
  assert.match(context, /\(\d+ more folders not listed\)/)
})

test('a project without source code injects nothing', () => {
  const box = sandbox()
  writeFiles(box, { 'README.md': '# Notes\n' })
  assert.strictEqual(sessionContext(box), null)
})
