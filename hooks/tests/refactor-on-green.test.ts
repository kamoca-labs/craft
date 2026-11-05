import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { test } from 'node:test'
import { injected, sandbox } from './helpers.ts'

const RULE = 'refactor-on-green'

test('green suite injects a short reminder to load the craft triage', () => {
  const context = injected(sandbox().run(RULE, { command: 'pnpm vitest run', stdout: 'Tests  12 passed (12)' }))
  assert.match(context!, /craft:craft/)
  assert.ok(context!.length < 500, `reminder has ${context!.length} chars`)
})

test('recognizes the most common test runners', () => {
  const commands = [
    'npx vitest', 'npm test', 'pnpm run test', 'yarn test', 'bun test', 'npx jest',
    'docker compose exec -T backend php artisan test', 'vendor/bin/pest', './vendor/bin/phpunit',
    'pytest -q', 'go test ./...', 'cargo test', 'node --test tests/', 'mvn test',
  ]
  for (const command of commands) {
    assert.ok(injected(sandbox().run(RULE, { command, stdout: '5 passed' })), `not recognized: ${command}`)
  }
})

test('recognizes the success summary of each runner', () => {
  const summaries = [
    'Tests  12 passed (12)', 'Tests:       3 passed, 3 total', 'Tests:    5 passed (10 assertions)', 'OK (5 tests, 10 assertions)',
    '5 passed in 0.31s', 'ok  \texample.com/pkg\t0.012s', 'test result: ok. 5 passed; 0 failed', '\u2139 pass 5\n\u2139 fail 0',
    '# pass 5\n# fail 0', '5 passing (20ms)', 'Ran 5 tests in 0.002s\n\nOK', 'Passed!  - Failed:     0, Passed:     5', '5 examples, 0 failures', ' 5 pass\n 0 fail', 'Tests run: 5, Failures: 0, Errors: 0, Skipped: 0\nBUILD SUCCESS',
  ]
  for (const stdout of summaries) {
    assert.ok(injected(sandbox().run(RULE, { command: 'npm test', stdout })), `not recognized: ${stdout}`)
  }
})

test('a run that failed or ran no test does not inject, even with a pass count', () => {
  const outputs = [
    ' 1 pass\n 1 fail\n Ran 2 tests across 1 file.',
    '(fail) upload > rejects a large file',
    '4 passed, 2 errors in 0.12s',
    '\u2139 tests 0\n\u2139 pass 0\n\u2139 fail 0',
    'test result: ok. 0 passed; 0 failed; 0 ignored; 12 filtered out',
    'ok  \texample.com/pkg\t0.004s [no tests to run]',
    'ok 1 - uploads a file',
    ' Tests  5 passed (5)\n Errors  1 error',
    'ERROR: Coverage for lines (72%) does not meet global threshold (80%)',
    'Jest: "global" coverage threshold for lines (80%) not met: 72%',
    'Tests  5 passed (5)\nnpm error Lifecycle script `test` failed with error:',
    'Tests run: 5, Failures: 2, Errors: 0\n<<< FAILURE!\nBUILD SUCCESS',
    'Tests are skipped.\nBUILD SUCCESS',
  ]
  for (const stdout of outputs) {
    assert.strictEqual(injected(sandbox().run(RULE, { command: 'npm test 2>&1 | tail -8', stdout })), null, stdout)
  }
})

test('recognizes green runs that report notices', () => {
  for (const stdout of ['BUILD SUCCESSFUL in 4s\n5 actionable tasks', 'OK, but there were issues!\nTests: 5, Assertions: 9, Deprecations: 1.', 'OK, but some tests were skipped!']) {
    assert.ok(injected(sandbox().run(RULE, { command: 'npm test', stdout })), stdout)
  }
})

test('output without a success summary does not inject', () => {
  const cutRedRun = "      at TestContext.<anonymous> (file:///app/tests/a.test.ts:43:10)\n    code: 'ERR_ASSERTION',\n    expected: null,\n  }"
  for (const stdout of [cutRedRun, '', 'ok']) {
    assert.strictEqual(injected(sandbox().run(RULE, { command: 'node --test tests/a.test.ts | tail -5', stdout })), null, stdout)
  }
})

test('runner text inside a heredoc or a quoted string does not inject', () => {
  const commands = [
    "python3 - <<'EOF'\nopen('BACKLOG.md', 'w').write('run node --test first')\nEOF",
    'cat > notes.md <<EOF\nnpm test\nEOF',
    "git commit -m 'fix: node --test cuts the output'",
    'echo "run pnpm vitest run"',
  ]
  for (const command of commands) {
    assert.strictEqual(injected(sandbox().run(RULE, { command, stdout: '5 passed' })), null, command)
  }
})

test('a runner inside sh -c still injects', () => {
  for (const command of ['docker compose exec -T app sh -c "pnpm vitest run"', 'docker compose exec app bash -lc "php artisan test"']) {
    assert.ok(injected(sandbox().run(RULE, { command, stdout: '5 passed' })), command)
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
  injected(box.run(RULE, { command: 'npm test', stdout: '5 passed' }))
  const [captured] = fs.readFileSync(box.casesLog, 'utf8').trim().split('\n').map((line) => JSON.parse(line))
  assert.strictEqual(captured.plugin, 'craft')
  assert.strictEqual(captured.origin, 'real')
  assert.deepStrictEqual(captured.inject, ['refactor-on-green'])
  assert.strictEqual(captured.tool_input.command, 'npm test')
})

test('recognizes monorepo, wrapper and JVM forms', () => {
  for (const command of ['pnpm --filter api test', 'yarn workspace api test', 'make test', './gradlew test', 'mvn clean test', 'python -m unittest', 'bundle exec rspec']) {
    assert.ok(injected(sandbox().run(RULE, { command, stdout: '5 passed' })), command)
  }
})

test('a command that only reads or installs does not inject', () => {
  for (const command of ['cat /tmp/jest.log', 'npm install -D vitest']) {
    assert.strictEqual(injected(sandbox().run(RULE, { command, stdout: '5 passed' })), null, command)
  }
})


test('a small change does not inject, a large change does', () => {
  const repo = (lines: number) => {
    const box = sandbox()
    fs.mkdirSync(box.projectDir, { recursive: true })
    const run = (...args: string[]) => spawnSync('git', args, { cwd: box.projectDir })
    run('init', '-q')
    fs.writeFileSync(`${box.projectDir}/a.ts`, 'export const a = 1\n')
    run('add', '.')
    run('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'seed')
    fs.writeFileSync(`${box.projectDir}/a.ts`, Array.from({ length: lines }, (_, index) => `export const a${index} = ${index}`).join('\n'))
    return injected(box.run(RULE, { command: 'npm test', stdout: '# pass 3\n# fail 0' }))
  }
  assert.strictEqual(repo(3), null)
  assert.ok(repo(30))
})
