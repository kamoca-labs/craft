import { inject, output, readInput, skillBody, TEST_RUNNER } from '../lib.ts'

const FAILURE = new RegExp([
  /\b[1-9]\d* (failed|failing)\b/,
  /\bFAIL(ED)?\b/,
  /\b(FAILURES|ERRORS)!/,
  /ELIFECYCLE/,
  /No test files found/,
  /^(#|\u2139) fail [1-9]/m,
  /^\u2716 /m,
  /^not ok \d+/m,
].map((pattern) => pattern.source).join('|'), 'm')

const input = readInput()
const command = input.tool_input.command || ''

if (TEST_RUNNER.test(command) && !FAILURE.test(output(input))) {
  inject('refactor-on-green', input, skillBody('craft'))
}
