import assert from 'node:assert'
import fs from 'node:fs'
import { test } from 'node:test'
import { injected, sandbox } from './helpers.ts'

const RULE = 'refactor-on-green'

test('green suite injects the craft triage', () => {
  const context = injected(sandbox().run(RULE, { command: 'pnpm vitest run', stdout: 'Tests  12 passed (12)' }))
  assert.match(context!, /SOLID/)
  assert.match(context!, /YAGNI/)
  assert.doesNotMatch(context!, /^---/)
})

test('recognizes the most common test runners', () => {
  const commands = [
    'npx vitest', 'npm test', 'pnpm run test', 'yarn test', 'bun test', 'npx jest',
    'docker compose exec -T backend php artisan test', 'vendor/bin/pest', './vendor/bin/phpunit',
    'pytest -q', 'go test ./...', 'cargo test', 'node --test tests/', 'mvn test',
  ]
  for (const command of commands) {
    assert.ok(injected(sandbox().run(RULE, { command, stdout: 'ok' })), `not recognized: ${command}`)
  }
})

test('failing output does not inject, even with exit 0 because of a pipe', () => {
  const failures = [
    'Tests  2 failed | 10 passed', ' FAIL  tests/a.test.ts', 'ELIFECYCLE  Command failed', 'No test files found',
    'FAILURES!', 'Tests:    1 failed, 3 passed', '# fail 2', 'not ok 3 - something', '1 failed, 4 passed in 0.3s',
    'test result: FAILED. 1 passed; 1 failed', '--- FAIL: TestX (0.00s)',
  ]
  for (const stdout of failures) {
    assert.strictEqual(injected(sandbox().run(RULE, { command: 'npm test | tail', stdout })), null, stdout)
  }
})

test('command that does not run tests does not inject', () => {
  assert.strictEqual(injected(sandbox().run(RULE, { command: 'ls tests/', stdout: 'a.test.ts' })), null)
  assert.strictEqual(injected(sandbox().run(RULE, { command: 'cat package.json | grep test', stdout: '"test"' })), null)
})

test('every injection becomes a real case in the log', () => {
  const box = sandbox()
  injected(box.run(RULE, { command: 'npm test', stdout: 'ok' }))
  const [captured] = fs.readFileSync(box.casesLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.strictEqual(captured.plugin, 'craft')
  assert.strictEqual(captured.origin, 'real')
  assert.deepStrictEqual(captured.inject, ['refactor-on-green'])
  assert.strictEqual(captured.tool_input.command, 'npm test')
})
