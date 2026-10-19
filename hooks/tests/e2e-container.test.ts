import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const bash = (command: string) => sandbox().pre('e2e-container', 'Bash', { command })

test('denies an E2E runner on the host', () => {
  for (const command of ['npx playwright test', 'pnpm exec playwright test tests/e2e', 'npx cypress run', 'yarn cypress run --spec items.cy.ts', 'php artisan dusk']) {
    const result = bash(command)
    assert.strictEqual(result.status, 2, command)
    assert.match(result.stderr, /\[craft:e2e-container\].*docker compose run/)
  }
})

test('allows an E2E runner inside a container', () => {
  for (const command of ['docker compose run --rm e2e npx playwright test', 'docker compose exec -T e2e npx cypress run', 'docker run --rm -v .:/app mcr.microsoft.com/playwright:v1.56.0-noble npx playwright test', 'docker exec e2e php artisan dusk']) {
    assert.strictEqual(bash(command).status, 0, command)
  }
})

test('allows commands that do not run E2E tests', () => {
  for (const command of ['npx playwright install chromium', 'pnpm vitest run src/upload.test.ts', 'grep playwright package.json']) {
    assert.strictEqual(bash(command).status, 0, command)
  }
})
