import assert from 'node:assert'
import fs from 'node:fs'
import { test } from 'node:test'
import { injected, sandbox } from './helpers.ts'

const RULE = 'refactor-on-green'

test('suíte verde injeta a triagem do craft', () => {
  const context = injected(sandbox().run(RULE, { command: 'pnpm vitest run', stdout: 'Tests  12 passed (12)' }))
  assert.match(context!, /SOLID/)
  assert.match(context!, /YAGNI/)
  assert.doesNotMatch(context!, /^---/)
})

test('reconhece os executores de teste mais comuns', () => {
  const commands = [
    'npx vitest', 'npm test', 'pnpm run test', 'yarn test', 'bun test', 'npx jest',
    'docker compose exec -T backend php artisan test', 'vendor/bin/pest', './vendor/bin/phpunit',
    'pytest -q', 'go test ./...', 'cargo test', 'node --test tests/', 'mvn test',
  ]
  for (const command of commands) {
    assert.ok(injected(sandbox().run(RULE, { command, stdout: 'ok' })), `não reconheceu: ${command}`)
  }
})

test('saída com falha não injeta, mesmo com exit 0 por causa de pipe', () => {
  const failures = [
    'Tests  2 failed | 10 passed', ' FAIL  tests/a.test.ts', 'ELIFECYCLE  Command failed', 'No test files found',
    'FAILURES!', 'Tests:    1 failed, 3 passed', '# fail 2', 'not ok 3 - something', '1 failed, 4 passed in 0.3s',
    'test result: FAILED. 1 passed; 1 failed', '--- FAIL: TestX (0.00s)',
  ]
  for (const stdout of failures) {
    assert.strictEqual(injected(sandbox().run(RULE, { command: 'npm test | tail', stdout })), null, stdout)
  }
})

test('comando que não roda teste não injeta', () => {
  assert.strictEqual(injected(sandbox().run(RULE, { command: 'ls tests/', stdout: 'a.test.ts' })), null)
  assert.strictEqual(injected(sandbox().run(RULE, { command: 'cat package.json | grep test', stdout: '"test"' })), null)
})

test('cada injeção vira caso real no log', () => {
  const box = sandbox()
  injected(box.run(RULE, { command: 'npm test', stdout: 'ok' }))
  const [captured] = fs.readFileSync(box.casesLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.strictEqual(captured.plugin, 'craft')
  assert.strictEqual(captured.origin, 'real')
  assert.deepStrictEqual(captured.inject, ['refactor-on-green'])
  assert.strictEqual(captured.tool_input.command, 'npm test')
})
