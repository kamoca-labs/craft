import { inject, message, output, readInput, testRunArguments } from '../lib.ts'

const FAILURE = new RegExp([
  /\b[1-9]\d* (failed|failing)\b/,
  /\bFAIL(ED)?\b/,
  /\b(FAILURES|ERRORS)!/,
  /ELIFECYCLE/,
  /No test files found/,
  /^(#|\u2139) fail [1-9]/m,
  /^\u2716 /m,
  /^not ok \d+/m,
  /^\s*[1-9]\d* fail\b/m,
  /^\(fail\) /m,
  /\b[1-9]\d* errors?\b/,
  /\bnot met\b|does not meet/,
  /^npm (error|ERR!)/m,
  /FAILURE!|Failures: [1-9]/,
  /no tests to run|Tests are skipped/,
].map((pattern) => pattern.source).join('|'), 'm')

const SUCCESS = new RegExp([
  /\b[1-9]\d* (passed|passing|pass)\b/,
  /^(#|\u2139) pass [1-9]/m,
  /\bOK \(\d+ tests?|^OK, but /m,
  /^ok\s+\S+\s+(\(cached\)|[\d.]+s)/m,
  /\bBUILD SUCCESS(FUL)?\b/,
  /^Ran [1-9]\d* tests? in [\s\S]*^OK\b/m,
  /\bPassed!\s+-\s+Failed:\s+0\b/,
  /\b[1-9]\d* examples?, 0 failures\b/,
].map((pattern) => pattern.source).join('|'), 'm')

const input = readInput()
const runOutput = output(input)

if (testRunArguments(input.tool_input.command || '') !== null && SUCCESS.test(runOutput) && !FAILURE.test(runOutput)) {
  inject('refactor-on-green', input, message('context.refactor-on-green'))
}
