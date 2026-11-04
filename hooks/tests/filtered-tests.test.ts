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

test('a command that only reads, installs or asks for help is not a test run', () => {
  const commands = [
    'cat jest.config.js', 'cat vitest.config.ts', 'cat phpunit.xml', 'cat pytest.ini', 'cat /tmp/jest.log',
    'npm install -D vitest', 'pnpm add -D vitest', 'pip install pytest', 'composer require --dev pestphp/pest',
    'pytest --version', 'which vitest', 'npx vitest --help',
  ]
  for (const command of commands) {
    assert.strictEqual(bash(command).status, 0, command)
  }
})

test('denies the full suite in monorepo, wrapper and JVM forms', () => {
  const commands = [
    'pnpm --filter api test', 'pnpm -r test', 'npm -w api test', 'npm --prefix api test', 'yarn workspace api test',
    'npx turbo run test', 'make test', 'npm t', './gradlew test', './mvnw test', 'mvn clean test', 'mvn verify',
    'npx mocha', 'python -m unittest', 'cargo nextest run', 'cargo +nightly test', 'deno test', 'dotnet test',
    'bundle exec rspec', 'cd api && CI=1 npm test', 'docker compose exec app bash -lc "php artisan test"',
  ]
  for (const command of commands) {
    assert.strictEqual(bash(command).status, 2, command)
  }
})

test('a flag value, a redirect or the whole test folder is not a filter', () => {
  const commands = [
    'go test -p 4 ./...', 'pytest -p no:cacheprovider', 'npx vitest run --config ./vitest.config.ts',
    'npm test > /tmp/out.log', 'pytest tests/', 'phpunit -c app/phpunit.xml',
  ]
  for (const command of commands) {
    assert.strictEqual(bash(command).status, 2, command)
  }
})

test('allows a filtered run of the JVM, mocha, unittest and rspec runners', () => {
  const commands = [
    './gradlew test --tests UploadTest', 'mvn test -Dtest=UploadTest', 'npx mocha test/upload.test.js',
    'python -m unittest tests.test_upload', 'bundle exec rspec spec/upload_spec.rb',
  ]
  for (const command of commands) {
    assert.strictEqual(bash(command).status, 0, command)
  }
})

