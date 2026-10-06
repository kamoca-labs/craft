import { inject, output, readInput, skillBody } from '../lib.ts'

const TEST_RUNNER = new RegExp([
  /\b(npx|pnpm( exec)?|bunx)\s+(vitest|jest)\b/,
  /(^|[\s;&|/])(vitest|jest|pest|phpunit|pytest)\b/,
  /\b(npm|pnpm|yarn|bun)(\s+run)?\s+test\b/,
  /\bartisan\s+test\b/,
  /\bnode\s+--test\b/,
  /\b(go|cargo|mvn|gradle)\s+test\b/,
].map((pattern) => pattern.source).join('|'))

const FAILURE = new RegExp([
  /\b[1-9]\d* (failed|failing)\b/,
  /\bFAIL(ED)?\b/,
  /\b(FAILURES|ERRORS)!/,
  /ELIFECYCLE/,
  /No test files found/,
  /^# fail [1-9]/m,
  /^not ok \d+/m,
].map((pattern) => pattern.source).join('|'), 'm')

const input = readInput()
const command = input.tool_input.command || ''

if (TEST_RUNNER.test(command) && !FAILURE.test(output(input))) {
  inject('refactor-on-green', input, skillBody('craft'))
}
