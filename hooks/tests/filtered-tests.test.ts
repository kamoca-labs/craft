import assert from 'node:assert'
import { test } from 'node:test'
import { bashRun, codeEdit, gitProject, runIn, runRule } from './transcript.ts'

const bash = (command: string, transcript: string[] = []) => runRule('filtered-tests', { command }, transcript)

test('denies the full suite when nothing requires it', () => {
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

test('checks every test run in a compound command', () => {
  for (const separator of [' && ', '; ', '\n', ' || ']) {
    assert.strictEqual(bash(`node --test tests/a.test.ts${separator}npm test`).status, 2, separator)
    assert.strictEqual(bash(`node --test tests/a.test.ts${separator}node --test tests/b.test.ts`).status, 0, separator)
  }
})

test('allows the full suite when the push needs it: tests, no CI, and a code change that is not green', () => {
  const project = gitProject({ 'tests/upload.test.ts': 'test', 'src/upload.ts': 'a', 'tests/b.test.ts': 'x', 'tests/c.test.ts': 'x', 'tests/d.test.ts': 'x', 'tests/e.test.ts': 'x', 'tests/f.test.ts': 'x', 'tests/g.test.ts': 'x', 'tests/h.test.ts': 'x', 'tests/i.test.ts': 'x', 'tests/j.test.ts': 'x', 'tests/k.test.ts': 'x' }, { 'src/upload.ts': 'b' })
  assert.strictEqual(runIn('filtered-tests', project, { command: 'pnpm vitest run' }).status, 0)
  assert.strictEqual(runIn('filtered-tests', project, { command: 'pnpm vitest run' }, [codeEdit('src/upload.ts'), bashRun('pnpm vitest run')]).status, 2)
})

test('denies the full suite in a project with CI, where the CI runs it', () => {
  const files = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`tests/t${index}.test.ts`, 'x']))
  const project = gitProject({ ...files, '.github/workflows/ci.yml': 'ci', 'src/upload.ts': 'a' }, { 'src/upload.ts': 'b' })
  assert.strictEqual(runIn('filtered-tests', project, { command: 'pnpm vitest run' }).status, 2)
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


test('a project with a small suite can run it in full', () => {
  const small = Array.from({ length: 3 }, (_, index) => `tests/case-${index}.test.ts`)
  const large = Array.from({ length: 11 }, (_, index) => `tests/case-${index}.test.ts`)
  const inRepo = (files: string[]) => {
    const result = runRule('filtered-tests', { command: 'npm test' }, [], files, {}, true)
    return result.status
  }
  assert.strictEqual(inRepo(small), 0)
  assert.strictEqual(inRepo(large), 2)
  assert.strictEqual(inRepo([]), 2)
})
