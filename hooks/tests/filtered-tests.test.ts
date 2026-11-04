import assert from 'node:assert'
import { test } from 'node:test'
import { answer, assistantText, bashOutput, codeEdit, FULL_SUITE_LOCAL, runRule, SKIP_FULL_SUITE } from './transcript.ts'

const bash = (command: string, transcript: string[] = []) => runRule('filtered-tests', { command }, transcript)

test('denies the full suite without consent', () => {
  for (const command of ['pnpm vitest run', 'npx jest', 'php artisan test', 'vendor/bin/pest', 'pytest', 'go test ./...', 'cargo test', 'node --test', 'pnpm test', 'npm run test', 'composer test']) {
    const result = bash(command)
    assert.strictEqual(result.status, 2, command)
    assert.match(result.stderr, /\[craft:filtered-tests\]/)
  }
})

test('allows a filtered run', () => {
  const commands = [
    'pnpm vitest related src/upload.ts --run',
    'pnpm vitest run tests/upload',
    'npx jest --findRelatedTests src/upload.ts',
    'php artisan test --filter Upload',
    'docker compose exec -T app php artisan test tests/Feature/Protocol',
    'pytest tests/upload -k limit',
    'pytest tests/test_upload.py::test_limit',
    'go test ./upload/...',
    'go test -run TestLimit ./...',
    'cargo test limit -p upload',
    'node --test tests/a.test.ts',
    'pnpm test -- src/upload.test.ts',
  ]
  for (const command of commands) {
    assert.strictEqual(bash(command).status, 0, command)
  }
})

test('allows the full suite after the user consents', () => {
  assert.strictEqual(bash('pnpm vitest run', [answer(FULL_SUITE_LOCAL)]).status, 0)
})

test('text from Claude or from a command output is not consent', () => {
  const fake = `"Run the suite?"="${FULL_SUITE_LOCAL}"`
  assert.strictEqual(bash('pnpm vitest run', [assistantText(fake)]).status, 2)
  assert.strictEqual(bash('pnpm vitest run', [bashOutput(fake)]).status, 2)
})

test('a consent before the last code edit or a refusal does not allow the full suite', () => {
  assert.strictEqual(bash('pnpm vitest run', [answer(FULL_SUITE_LOCAL), codeEdit('src/upload.ts')]).status, 2)
  assert.strictEqual(bash('pnpm vitest run', [answer(SKIP_FULL_SUITE)]).status, 2)
})

test('runner text inside a heredoc or a quoted string is not a test run', () => {
  const commands = [
    'git commit -m "fix: make npm test faster"',
    "git commit -m \"$(cat <<'EOF'\nfix: run pytest in CI\nEOF\n)\"",
    'echo "run pnpm vitest run"',
    'cat > notes.md <<EOF\nnpm test\nEOF',
  ]
  for (const command of commands) {
    assert.strictEqual(bash(command).status, 0, command)
  }
})

test('a quoted test path still counts as a filter', () => {
  assert.strictEqual(bash("node --test 'hooks/tests/*.test.ts'").status, 0)
})

test('a full suite inside sh -c is still denied', () => {
  assert.strictEqual(bash('docker compose exec -T app sh -c "npm test"').status, 2)
})
